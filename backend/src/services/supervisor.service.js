import LawFork from '../models/LawFork.js';
import LawChangeProposal from '../models/LawChangeProposal.js';
import Group from '../models/Group.js';

function toId(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._id) return String(value._id);
  return String(value);
}

function toDisplayName(user) {
  if (!user) return 'Unknown';
  return user.fullName || user.displayName || user.email || 'Unknown';
}

function toEmail(user) {
  if (!user) return '';
  return user.email || '';
}

function toLawSnapshot(law) {
  if (!law) {
    return null;
  }
  return {
    _id: toId(law),
    title: law.title || '—',
    code: law.code || '—',
  };
}

function toDateValue(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function laterDate(left, right) {
  if (!left) return right || null;
  if (!right) return left || null;
  return left > right ? left : right;
}

function workflowBucket(type, status) {
  if (type === 'fork') {
    if (status === 'approved') return 'approved';
    if (status === 'rejected') return 'rejected';
    if (status === 'review') return 'review';
    return 'draft';
  }

  if (status === 'approved') return 'approved';
  if (['rejected', 'withdrawn', 'archived', 'superseded'].includes(status)) {
    return 'rejected';
  }
  if (status === 'active') return 'review';
  return 'draft';
}

function initWorkflowStats() {
  return {
    draftCount: 0,
    reviewCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
  };
}

function applyWorkflowStat(target, type, status) {
  const bucket = workflowBucket(type, status);
  if (bucket === 'approved') target.approvedCount += 1;
  else if (bucket === 'rejected') target.rejectedCount += 1;
  else if (bucket === 'review') target.reviewCount += 1;
  else target.draftCount += 1;
}

function createNormalizedItem({
  id,
  type,
  title,
  status,
  updatedAt,
  law,
  lawId,
  author,
  authorId,
}) {
  const snapshot = toLawSnapshot(law);
  const resolvedLawId = snapshot?._id || toId(lawId);
  const resolvedAuthorId = toId(author?._id || authorId);

  return {
    id: String(id),
    type,
    title:
      title ||
      (type === 'fork' ? 'Форк без назви' : 'Пропозиція без заголовка'),
    status: status || 'draft',
    updatedAt,
    updatedAtDate: toDateValue(updatedAt),
    lawId: resolvedLawId,
    law: snapshot,
    authorId: resolvedAuthorId,
    authorName: toDisplayName(author),
    authorEmail: toEmail(author),
  };
}

function normalizeGroupToSupervisorSchema(group) {
  if (!group) return null;
  const groupObj =
    typeof group.toObject === 'function' ? group.toObject() : group;

  const memberIds = (groupObj.members || [])
    .filter((m) => m.status === 'active' && m.userId)
    .map((m) => m.userId); // populated User object or string ID

  return {
    ...groupObj,
    memberIds,
    trackedLawIds: groupObj.trackedLaws || [],
  };
}

async function loadSupervisorGroups(supervisorId) {
  const groups = await Group.find({ supervisorId, status: 'active' })
    .populate('trackedLaws', 'title code')
    .populate('members.userId', 'fullName email role')
    .lean();
  return groups.map(normalizeGroupToSupervisorSchema);
}

async function loadActivityItems(groups) {
  const memberIds = [
    ...new Set(
      groups.flatMap((group) => group.memberIds.map((member) => toId(member))),
    ),
  ];
  const lawIds = [
    ...new Set(
      groups.flatMap((group) => group.trackedLawIds.map((law) => toId(law))),
    ),
  ];

  if (!memberIds.length || !lawIds.length) {
    return [];
  }

  const [forks, proposals] = await Promise.all([
    LawFork.find({
      authorId: { $in: memberIds },
      lawId: { $in: lawIds },
    })
      .select('lawId authorId title status updatedAt')
      .populate('lawId', 'title code')
      .populate('authorId', 'fullName email')
      .lean(),
    LawChangeProposal.find({
      created_by: { $in: memberIds },
      law_id: { $in: lawIds },
    })
      .select('law_id created_by reason status updatedAt')
      .populate('law_id', 'title code')
      .populate('created_by', 'fullName email')
      .lean(),
  ]);

  return [
    ...forks.map((fork) =>
      createNormalizedItem({
        id: fork._id,
        type: 'fork',
        title: fork.title,
        status: fork.status,
        updatedAt: fork.updatedAt,
        law: fork.lawId,
        lawId: fork.lawId,
        author: fork.authorId,
        authorId: fork.authorId,
      }),
    ),
    ...proposals.map((proposal) =>
      createNormalizedItem({
        id: proposal._id,
        type: 'proposal',
        title:
          proposal.reason || `Зміна до ${proposal.law_id?.title || 'закону'}`,
        status: proposal.status,
        updatedAt: proposal.updatedAt,
        law: proposal.law_id,
        lawId: proposal.law_id,
        author: proposal.created_by,
        authorId: proposal.created_by,
      }),
    ),
  ].sort((left, right) => {
    const leftTime = left.updatedAtDate?.getTime() || 0;
    const rightTime = right.updatedAtDate?.getTime() || 0;
    return rightTime - leftTime;
  });
}

function buildDashboardSummary(groups, items) {
  const totalMembers = new Set(
    groups.flatMap((group) => group.memberIds.map((member) => toId(member))),
  ).size;
  const totalTrackedLaws = new Set(
    groups.flatMap((group) => group.trackedLawIds.map((law) => toId(law))),
  ).size;

  const statusBreakdown = {
    totalChanges: items.length,
    ...initWorkflowStats(),
  };
  for (const item of items) {
    applyWorkflowStat(statusBreakdown, item.type, item.status);
  }

  const groupMonitoring = [];
  const groupHighlights = [];

  for (const group of groups) {
    const memberIdSet = new Set(group.memberIds.map((member) => toId(member)));
    let groupLastActivity = null;
    let groupChangeCount = 0;
    let activeLawsCount = 0;
    const groupStats = initWorkflowStats();

    for (const law of group.trackedLawIds) {
      const lawId = toId(law);
      const matchingItems = items.filter(
        (item) => item.lawId === lawId && memberIdSet.has(item.authorId),
      );

      const rowStats = initWorkflowStats();
      let lastActivity = null;
      let forkCount = 0;
      let proposalCount = 0;

      for (const item of matchingItems) {
        if (item.type === 'fork') forkCount += 1;
        else proposalCount += 1;
        applyWorkflowStat(rowStats, item.type, item.status);
        applyWorkflowStat(groupStats, item.type, item.status);
        lastActivity = laterDate(lastActivity, item.updatedAtDate);
      }

      const changeCount = forkCount + proposalCount;
      if (changeCount > 0) {
        groupChangeCount += changeCount;
        activeLawsCount += 1;
        groupLastActivity = laterDate(groupLastActivity, lastActivity);
      }

      groupMonitoring.push({
        groupId: String(group._id),
        groupName: group.name,
        course: group.course || '',
        law: toLawSnapshot(law),
        forkCount,
        proposalCount,
        changeCount,
        activeAuthors: new Set(matchingItems.map((item) => item.authorId)).size,
        lastActivityAt: lastActivity?.toISOString() || null,
        ...rowStats,
      });
    }

    groupHighlights.push({
      groupId: String(group._id),
      groupName: group.name,
      course: group.course || '',
      memberCount: group.memberIds.length,
      trackedLawsCount: group.trackedLawIds.length,
      activeLawsCount,
      changeCount: groupChangeCount,
      lastActivityAt: groupLastActivity?.toISOString() || null,
      ...groupStats,
    });
  }

  const studentMap = new Map();
  for (const group of groups) {
    const groupId = String(group._id);
    const groupName = group.name;
    const trackedLawIdSet = new Set(
      group.trackedLawIds.map((law) => toId(law)),
    );
    const memberById = new Map(
      group.memberIds.map((member) => [toId(member), member]),
    );

    for (const item of items) {
      if (!trackedLawIdSet.has(item.lawId) || !memberById.has(item.authorId)) {
        continue;
      }

      const member = memberById.get(item.authorId);
      if (!studentMap.has(item.authorId)) {
        studentMap.set(item.authorId, {
          userId: item.authorId,
          name: toDisplayName(member),
          email: toEmail(member),
          groups: new Map(),
          forkCount: 0,
          proposalCount: 0,
          changeCount: 0,
          lastActivityAtDate: null,
          itemIds: new Set(),
          ...initWorkflowStats(),
        });
      }

      const student = studentMap.get(item.authorId);
      student.groups.set(groupId, {
        id: groupId,
        name: groupName,
        course: group.course || '',
      });

      if (student.itemIds.has(item.id)) {
        continue;
      }

      student.itemIds.add(item.id);
      student.changeCount += 1;
      if (item.type === 'fork') student.forkCount += 1;
      else student.proposalCount += 1;
      applyWorkflowStat(student, item.type, item.status);
      student.lastActivityAtDate = laterDate(
        student.lastActivityAtDate,
        item.updatedAtDate,
      );
    }
  }

  const studentActivity = Array.from(studentMap.values())
    .map((student) => ({
      userId: student.userId,
      name: student.name,
      email: student.email,
      groups: Array.from(student.groups.values()),
      forkCount: student.forkCount,
      proposalCount: student.proposalCount,
      changeCount: student.changeCount,
      lastActivityAt: student.lastActivityAtDate?.toISOString() || null,
      draftCount: student.draftCount,
      reviewCount: student.reviewCount,
      approvedCount: student.approvedCount,
      rejectedCount: student.rejectedCount,
    }))
    .sort((left, right) => {
      if (right.changeCount !== left.changeCount) {
        return right.changeCount - left.changeCount;
      }
      return (
        (new Date(right.lastActivityAt || 0).getTime() || 0) -
        (new Date(left.lastActivityAt || 0).getTime() || 0)
      );
    });

  const recentActivity = items.slice(0, 16).map((item) => {
    const matchingGroups = groups.filter(
      (group) =>
        group.memberIds.some((member) => toId(member) === item.authorId) &&
        group.trackedLawIds.some((law) => toId(law) === item.lawId),
    );
    const groupNames = matchingGroups.map((group) => group.name);

    return {
      id: item.id,
      type: item.type,
      title: item.title,
      author: item.authorName,
      authorEmail: item.authorEmail,
      law: item.law?.title || '—',
      lawCode: item.law?.code || '—',
      lawId: item.lawId,
      status: item.status,
      updatedAt: item.updatedAt,
      groupIds: matchingGroups.map((group) => String(group._id)),
      groups: groupNames,
      groupLabel: groupNames.length ? groupNames.join(', ') : 'Без групи',
    };
  });

  const sortedMonitoring = groupMonitoring.sort((left, right) => {
    const rightTime = new Date(right.lastActivityAt || 0).getTime() || 0;
    const leftTime = new Date(left.lastActivityAt || 0).getTime() || 0;
    if (rightTime !== leftTime) return rightTime - leftTime;
    if (right.changeCount !== left.changeCount) {
      return right.changeCount - left.changeCount;
    }
    return `${left.groupName}${left.law?.code}`.localeCompare(
      `${right.groupName}${right.law?.code}`,
      'uk',
    );
  });

  return {
    groups,
    totalMembers,
    totalTrackedLaws,
    statusBreakdown,
    groupHighlights,
    groupMonitoring: sortedMonitoring,
    lawActivity: sortedMonitoring,
    studentActivity,
    recentActivity,
  };
}

export async function getGroupsBySupervisor(supervisorId) {
  return loadSupervisorGroups(supervisorId);
}

export async function createGroup(
  supervisorId,
  { name, course, memberIds = [], trackedLawIds = [] },
) {
  const members = memberIds.map((userId) => ({
    userId,
    status: 'active',
    joinedAt: new Date(),
  }));

  const group = await Group.create({
    supervisorId,
    name,
    course,
    members,
    trackedLaws: trackedLawIds,
    status: 'active',
  });

  return normalizeGroupToSupervisorSchema(group);
}

export async function updateGroup(groupId, supervisorId, data) {
  const group = await Group.findOne({ _id: groupId, supervisorId });
  if (!group)
    throw Object.assign(new Error('Group not found or not authorized'), {
      statusCode: 404,
    });

  const { name, course, memberIds, trackedLawIds, status } = data;
  if (name !== undefined) group.name = name;
  if (course !== undefined) group.course = course;
  if (status !== undefined) group.status = status;
  if (memberIds !== undefined) {
    group.members = memberIds.map((userId) => ({
      userId,
      status: 'active',
      joinedAt: new Date(),
    }));
  }
  if (trackedLawIds !== undefined) group.trackedLaws = trackedLawIds;

  const saved = await group.save();
  return normalizeGroupToSupervisorSchema(saved);
}

export async function getGroupById(groupId, supervisorId) {
  const groups = await loadSupervisorGroups(supervisorId);
  const summary = buildDashboardSummary(
    groups,
    await loadActivityItems(groups),
  );
  const group = groups.find((item) => String(item._id) === String(groupId));

  if (!group) {
    throw Object.assign(new Error('Group not found'), { statusCode: 404 });
  }

  return {
    group,
    highlight:
      summary.groupHighlights.find(
        (item) => item.groupId === String(group._id),
      ) || null,
    monitoring: summary.groupMonitoring.filter(
      (item) => item.groupId === String(group._id),
    ),
    students: summary.studentActivity.filter((item) =>
      item.groups.some((groupItem) => groupItem.id === String(group._id)),
    ),
    recentActivity: summary.recentActivity.filter((item) =>
      item.groupIds.includes(String(group._id)),
    ),
  };
}

export async function getDashboardSummary(supervisorId) {
  const groups = await loadSupervisorGroups(supervisorId);
  const items = await loadActivityItems(groups);
  return buildDashboardSummary(groups, items);
}
