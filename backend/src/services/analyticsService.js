import mongoose from 'mongoose';
import LawFork from '../models/LawFork.js';
import Proposal from '../models/Proposal.js';
import Amendment from '../models/Amendment.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import Law from '../models/Law.js';

function periodToDays(period) {
  if (period === '3m') return 90;
  if (period === '6m') return 180;
  if (period === 'year') return 365;
  return 30;
}

function getPeriodStart(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

// Always 4 equal buckets labelled Тиж 1..4
function getBuckets(days) {
  const now = Date.now();
  const bucketMs = (days / 4) * 86400000;
  return [3, 2, 1, 0].reverse().map((i) => ({
    label: `Тиж ${4 - i}`,
    start: new Date(now - (i + 1) * bucketMs),
    end: new Date(now - i * bucketMs),
  }));
}

function inBucket(date, b) {
  return date >= b.start && date < b.end;
}

// ──────────────────────────────────────────────────────────────────────────────
// SUPERVISOR
// ──────────────────────────────────────────────────────────────────────────────
export async function getSupervisorAnalytics(supervisorId, period = 'month') {
  const days = periodToDays(period);
  const since = getPeriodStart(days);
  const buckets = getBuckets(days);

  // All member IDs (incl. supervisor)
  const groups = await Group.find({ supervisorId }).lean();
  const memberIdStrs = [
    ...new Set([
      String(supervisorId),
      ...groups.flatMap((g) =>
        g.members
          .filter((m) => m.status === 'active')
          .map((m) => String(m.userId)),
      ),
    ]),
  ];
  const memberOids = memberIdStrs.map((id) => new mongoose.Types.ObjectId(id));

  const [forks, proposals, amendments] = await Promise.all([
    LawFork.find({ authorId: { $in: memberOids }, createdAt: { $gte: since } })
      .select('authorId status lawId createdAt')
      .lean(),
    Proposal.find({
      created_by: { $in: memberOids },
      createdAt: { $gte: since },
    })
      .select('created_by status law_id createdAt')
      .lean(),
    Amendment.find({
      created_by: { $in: memberOids },
      createdAt: { $gte: since },
    })
      .select('created_by createdAt')
      .lean(),
  ]);

  const approvedForks = forks.filter((f) => f.status === 'approved').length;
  const approvedProposals = proposals.filter(
    (p) => p.status === 'approved',
  ).length;
  const totalApproved = approvedForks + approvedProposals;
  const totalPool = forks.length + proposals.length;
  const approvalRate =
    totalPool > 0 ? Math.round((totalApproved / totalPool) * 100) : 0;

  // Active legislators — submitted at least 1 thing in period
  const activeLegislatorIds = new Set([
    ...forks.map((f) => String(f.authorId)),
    ...proposals.map((p) => String(p.created_by)),
    ...amendments.map((a) => String(a.created_by)),
  ]);

  // Weekly breakdown
  const weeklyActivity = buckets.map((b) => ({
    week: b.label,
    forks: forks.filter((f) => inBucket(f.createdAt, b)).length,
    proposals: proposals.filter((p) => inBucket(p.createdAt, b)).length,
    amendments: amendments.filter((a) => inBucket(a.createdAt, b)).length,
  }));

  // Top-5 legislators by approved count
  const approvedByUser = {};
  const forksPerUser = {};
  const proposPerUser = {};
  forks.forEach((f) => {
    const id = String(f.authorId);
    forksPerUser[id] = (forksPerUser[id] || 0) + 1;
    if (f.status === 'approved')
      approvedByUser[id] = (approvedByUser[id] || 0) + 1;
  });
  proposals.forEach((p) => {
    const id = String(p.created_by);
    proposPerUser[id] = (proposPerUser[id] || 0) + 1;
    if (p.status === 'approved')
      approvedByUser[id] = (approvedByUser[id] || 0) + 1;
  });

  const topIds = Object.entries(approvedByUser)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  let topLegislators = [];
  if (topIds.length) {
    const users = await User.find({ _id: { $in: topIds } })
      .select('fullName displayName')
      .lean();
    const umap = Object.fromEntries(
      users.map((u) => [
        String(u._id),
        u.fullName || u.displayName || 'Unknown',
      ]),
    );
    topLegislators = topIds.map((id) => ({
      name: umap[id] || 'Unknown',
      forks: forksPerUser[id] || 0,
      proposals: proposPerUser[id] || 0,
      approved: approvedByUser[id] || 0,
    }));
  }

  // Law coverage — top 3 by forks
  const lawForkMap = {};
  const lawPropMap = {};
  forks.forEach((f) => {
    if (f.lawId)
      lawForkMap[String(f.lawId)] = (lawForkMap[String(f.lawId)] || 0) + 1;
  });
  proposals.forEach((p) => {
    if (p.law_id)
      lawPropMap[String(p.law_id)] = (lawPropMap[String(p.law_id)] || 0) + 1;
  });
  const topLawIds = Object.entries(lawForkMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id);
  let lawCoverage = [];
  if (topLawIds.length) {
    const laws = await Law.find({ _id: { $in: topLawIds } })
      .select('title')
      .lean();
    const lmap = Object.fromEntries(
      laws.map((l) => [String(l._id), l.title || '—']),
    );
    lawCoverage = topLawIds.map((id) => ({
      law: lmap[id] || '—',
      forks: lawForkMap[id] || 0,
      proposals: lawPropMap[id] || 0,
    }));
  }

  return {
    kpi: {
      activeLegislators: activeLegislatorIds.size,
      approvalsThisPeriod: totalApproved,
      groups: {
        total: groups.length,
        active: groups.filter((g) => g.status === 'active').length,
      },
      totalForks: forks.length,
      totalProposals: proposals.length,
      approvalRate,
      activeCount: activeLegislatorIds.size,
    },
    weeklyActivity,
    topLegislators,
    lawCoverage,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// LEGISLATOR
// ──────────────────────────────────────────────────────────────────────────────
export async function getLegislatorAnalytics(userId, period = 'month') {
  const days = periodToDays(period);
  const since = getPeriodStart(days);
  const buckets = getBuckets(days);
  const oid = new mongoose.Types.ObjectId(userId);

  const [myForks, myProposals, myAmendments] = await Promise.all([
    LawFork.find({ authorId: oid, createdAt: { $gte: since } })
      .select('status createdAt')
      .lean(),
    Proposal.find({ created_by: oid, createdAt: { $gte: since } })
      .select('status createdAt')
      .lean(),
    Amendment.find({ created_by: oid, createdAt: { $gte: since } })
      .select('createdAt')
      .lean(),
  ]);

  const approved =
    myForks.filter((f) => f.status === 'approved').length +
    myProposals.filter((p) => p.status === 'approved').length;
  const rejected =
    myForks.filter((f) => f.status === 'rejected').length +
    myProposals.filter((p) => p.status === 'rejected').length;
  const pending =
    myForks.filter((f) => f.status === 'review').length +
    myProposals.filter((p) => p.status === 'review').length;

  const total = myForks.length + myProposals.length + myAmendments.length;
  const approvalPool = myForks.length + myProposals.length;
  const approvalRate =
    approvalPool > 0 ? Math.round((approved / approvalPool) * 100) : 0;

  // Platform-wide averages for anonymous comparison
  const [allForks, allProposals, allAmendments] = await Promise.all([
    LawFork.find({ createdAt: { $gte: since } })
      .select('authorId')
      .lean(),
    Proposal.find({ createdAt: { $gte: since } })
      .select('created_by')
      .lean(),
    Amendment.find({ createdAt: { $gte: since } })
      .select('created_by')
      .lean(),
  ]);

  const userCount = {};
  allForks.forEach((f) => {
    const id = String(f.authorId);
    userCount[id] = (userCount[id] || 0) + 1;
  });
  allProposals.forEach((p) => {
    const id = String(p.created_by);
    userCount[id] = (userCount[id] || 0) + 1;
  });
  allAmendments.forEach((a) => {
    const id = String(a.created_by);
    userCount[id] = (userCount[id] || 0) + 1;
  });

  const counts = Object.values(userCount);
  const platformAvg = counts.length
    ? Math.round(counts.reduce((a, b) => a + b, 0) / counts.length)
    : 0;

  // Group average
  const myGroups = await Group.find({
    'members.userId': oid,
    'members.status': 'active',
  }).lean();
  const groupMemberIds = [
    ...new Set(
      myGroups.flatMap((g) =>
        g.members
          .filter((m) => m.status === 'active')
          .map((m) => String(m.userId)),
      ),
    ),
  ].filter((id) => id !== String(userId));
  const groupCounts = groupMemberIds.map((id) => userCount[id] || 0);
  const groupAvg = groupCounts.length
    ? Math.round(groupCounts.reduce((a, b) => a + b, 0) / groupCounts.length)
    : 0;

  const mostActive = [
    { label: 'Форки', count: myForks.length },
    { label: 'Пропозиції', count: myProposals.length },
    { label: 'Поправки', count: myAmendments.length },
  ].sort((a, b) => b.count - a.count)[0];

  return {
    stats: {
      forks: myForks.length,
      proposals: myProposals.length,
      amendments: myAmendments.length,
      approved,
      rejected,
      pending,
    },
    approvalRate,
    total,
    mostActive,
    weeklyActivity: buckets.map((b) => ({
      week: b.label,
      actions:
        myForks.filter((f) => inBucket(f.createdAt, b)).length +
        myProposals.filter((p) => inBucket(p.createdAt, b)).length +
        myAmendments.filter((a) => inBucket(a.createdAt, b)).length,
    })),
    comparison: { myScore: total, groupAvg, platformAvg },
    portfolio: { approved, rejected, pending },
  };
}
