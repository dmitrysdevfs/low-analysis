import SupervisorGroup from '../models/SupervisorGroup.js';
import Proposal from '../models/Proposal.js';
import LawChangeProposal from '../models/LawChangeProposal.js';

export async function getGroupsBySupervisor(supervisorId) {
  return SupervisorGroup.find({ supervisorId, status: 'active' })
    .populate('trackedLawIds', 'title code')
    .populate('memberIds', 'fullName email')
    .lean();
}

export async function createGroup(
  supervisorId,
  { name, course, memberIds = [], trackedLawIds = [] },
) {
  return SupervisorGroup.create({
    supervisorId,
    name,
    course,
    memberIds,
    trackedLawIds,
  });
}

export async function updateGroup(groupId, supervisorId, data) {
  const group = await SupervisorGroup.findOne({ _id: groupId, supervisorId });
  if (!group)
    throw Object.assign(new Error('Group not found or not authorized'), {
      statusCode: 404,
    });

  const { name, course, memberIds, trackedLawIds, status } = data;
  if (name !== undefined) group.name = name;
  if (course !== undefined) group.course = course;
  if (memberIds !== undefined) group.memberIds = memberIds;
  if (trackedLawIds !== undefined) group.trackedLawIds = trackedLawIds;
  if (status !== undefined) group.status = status;

  return group.save();
}

export async function getGroupById(groupId, supervisorId) {
  const group = await SupervisorGroup.findOne({ _id: groupId, supervisorId })
    .populate('trackedLawIds', 'title code')
    .populate('memberIds', 'fullName email role')
    .lean();
  if (!group)
    throw Object.assign(new Error('Group not found'), { statusCode: 404 });
  return group;
}

export async function getDashboardSummary(supervisorId) {
  const groups = await SupervisorGroup.find({ supervisorId, status: 'active' })
    .populate('trackedLawIds', 'title code')
    .populate('memberIds', 'fullName email')
    .lean();

  const allMemberIds = [
    ...new Set(groups.flatMap((g) => g.memberIds.map((m) => m._id.toString()))),
  ];
  const allLawIds = [
    ...new Set(
      groups.flatMap((g) => g.trackedLawIds.map((l) => l._id.toString())),
    ),
  ];

  const [forks, proposals] = await Promise.all([
    Proposal.find({ created_by: { $in: allMemberIds } })
      .populate('law_id', 'title code')
      .populate('created_by', 'fullName')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean(),
    LawChangeProposal.find({ created_by: { $in: allMemberIds } })
      .populate('law_id', 'title code')
      .populate('created_by', 'fullName')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean(),
  ]);

  const lawActivity = {};
  for (const fork of forks) {
    const lawId = fork.law_id?._id?.toString();
    if (!lawId) continue;
    if (!lawActivity[lawId]) {
      lawActivity[lawId] = {
        law: fork.law_id,
        forkCount: 0,
        proposalCount: 0,
        lastActivityAt: null,
      };
    }
    lawActivity[lawId].forkCount += 1;
    const at = new Date(fork.updatedAt);
    if (
      !lawActivity[lawId].lastActivityAt ||
      at > lawActivity[lawId].lastActivityAt
    ) {
      lawActivity[lawId].lastActivityAt = at;
    }
  }
  for (const p of proposals) {
    const lawId = p.law_id?._id?.toString();
    if (!lawId) continue;
    if (!lawActivity[lawId]) {
      lawActivity[lawId] = {
        law: p.law_id,
        forkCount: 0,
        proposalCount: 0,
        lastActivityAt: null,
      };
    }
    lawActivity[lawId].proposalCount += 1;
    const at = new Date(p.updatedAt);
    if (
      !lawActivity[lawId].lastActivityAt ||
      at > lawActivity[lawId].lastActivityAt
    ) {
      lawActivity[lawId].lastActivityAt = at;
    }
  }

  const recentActivity = [
    ...forks.slice(0, 10).map((f) => ({
      type: 'fork',
      title: f.title,
      author: f.created_by?.fullName ?? 'Unknown',
      law: f.law_id?.title ?? '—',
      status: f.status,
      updatedAt: f.updatedAt,
    })),
    ...proposals.slice(0, 10).map((p) => ({
      type: 'proposal',
      title: p.reason || `Зміна до ${p.law_id?.title ?? '—'}`,
      author: p.created_by?.fullName ?? 'Unknown',
      law: p.law_id?.title ?? '—',
      status: p.status,
      updatedAt: p.updatedAt,
    })),
  ]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 20);

  return {
    groups,
    totalMembers: allMemberIds.length,
    totalTrackedLaws: allLawIds.length,
    lawActivity: Object.values(lawActivity),
    recentActivity,
  };
}
