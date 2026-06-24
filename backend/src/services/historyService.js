import mongoose from 'mongoose';
import LawFork from '../models/LawFork.js';
import Proposal from '../models/Proposal.js';
import Amendment from '../models/Amendment.js';
import Group from '../models/Group.js';

// ─── Supervisor history ───────────────────────────────────────────────────────

export async function getSupervisorHistory(
  supervisorId,
  { from, to, type, page = 1, limit = 20 } = {},
) {
  const oid = new mongoose.Types.ObjectId(supervisorId);
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to + 'T23:59:59.999Z') : null;

  const inRange = (date) => {
    if (!date) return false;
    if (fromDate && date < fromDate) return false;
    if (toDate && date > toDate) return false;
    return true;
  };

  const groups = await Group.find({ supervisorId: oid })
    .populate('members.userId', 'displayName email')
    .lean();

  const memberIds = [
    ...new Set(
      groups
        .flatMap((g) => g.members.map((m) => m.userId?._id?.toString()))
        .filter(Boolean),
    ),
  ];
  const memberOids = memberIds.map((id) => new mongoose.Types.ObjectId(id));

  const needForks =
    !type || type === 'all' || type === 'approve' || type === 'reject';
  const forks =
    needForks && memberOids.length > 0
      ? await LawFork.find({
          authorId: { $in: memberOids },
          status: { $in: ['approved', 'rejected'] },
        })
          .populate('authorId', 'displayName email')
          .populate('lawId', 'title number')
          .lean()
      : [];

  const events = [];

  const wantType = (t) => !type || type === 'all' || type === t;

  // create_group
  if (wantType('create_group')) {
    for (const g of groups) {
      if (!inRange(g.createdAt)) continue;
      events.push({
        id: `create_group_${g._id}`,
        date: g.createdAt.toISOString(),
        type: 'create_group',
        participant: '—',
        group: g.name,
        details: `Створено навчальну групу.`,
      });
    }
  }

  // archive_group
  if (wantType('archive_group')) {
    for (const g of groups) {
      if (g.status !== 'archived' || !inRange(g.updatedAt)) continue;
      events.push({
        id: `archive_group_${g._id}`,
        date: g.updatedAt.toISOString(),
        type: 'archive_group',
        participant: '—',
        group: g.name,
        details: 'Групу переведено в архів після завершення блоку.',
      });
    }
  }

  // join
  if (wantType('join')) {
    for (const g of groups) {
      for (const m of g.members) {
        if (!inRange(m.joinedAt)) continue;
        const name = m.userId?.displayName || m.userId?.email || 'Учасник';
        events.push({
          id: `join_${g._id}_${m.userId?._id}`,
          date: m.joinedAt.toISOString(),
          type: 'join',
          participant: name,
          group: g.name,
          details: `${name} приєднався до групи.`,
        });
      }
    }
  }

  // approve
  if (wantType('approve')) {
    for (const f of forks) {
      if (f.status !== 'approved' || !inRange(f.updatedAt)) continue;
      const name = f.authorId?.displayName || f.authorId?.email || 'Учасник';
      events.push({
        id: `approve_${f._id}`,
        date: f.updatedAt.toISOString(),
        type: 'approve',
        participant: name,
        group: f.lawId?.title || f.lawId?.number || 'Закон',
        details: `Погоджено форк: "${f.title}".`,
      });
    }
  }

  // reject
  if (wantType('reject')) {
    for (const f of forks) {
      if (f.status !== 'rejected' || !inRange(f.updatedAt)) continue;
      const name = f.authorId?.displayName || f.authorId?.email || 'Учасник';
      events.push({
        id: `reject_${f._id}`,
        date: f.updatedAt.toISOString(),
        type: 'reject',
        participant: name,
        group: f.lawId?.title || f.lawId?.number || 'Закон',
        details: `Відхилено форк: "${f.title}"${f.reviewNote ? '. ' + f.reviewNote : ''}.`,
      });
    }
  }

  events.sort((a, b) => new Date(b.date) - new Date(a.date));

  const total = events.length;
  const pg = Math.max(1, parseInt(page));
  const lim = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pg - 1) * lim;

  return {
    items: events.slice(skip, skip + lim),
    total,
    page: pg,
    pages: Math.max(1, Math.ceil(total / lim)),
    limit: lim,
  };
}

// ─── Legislator history ───────────────────────────────────────────────────────

export async function getLegislatorHistory(
  userId,
  { type, page = 1, limit = 20 } = {},
) {
  const oid = new mongoose.Types.ObjectId(userId);

  const wantType = (t) => !type || type === 'all' || type === t;

  const [
    forks,
    proposals,
    amendments,
    groups,
    kpiForks,
    kpiProposals,
    kpiAmendments,
  ] = await Promise.all([
    wantType('fork_created') || wantType('fork_submitted')
      ? LawFork.find({ authorId: oid }).populate('lawId', 'title number').lean()
      : [],
    wantType('proposal_created') ||
    wantType('proposal_approved') ||
    wantType('proposal_rejected')
      ? Proposal.find({ created_by: oid })
          .populate('law_id', 'title number')
          .lean()
      : [],
    wantType('amendment_created')
      ? Amendment.find({ created_by: oid })
          .populate('law_id', 'title number')
          .lean()
      : [],
    wantType('group_joined')
      ? Group.find({ 'members.userId': oid }).lean()
      : [],
    LawFork.countDocuments({ authorId: oid }),
    Proposal.countDocuments({ created_by: oid }),
    Amendment.countDocuments({ created_by: oid }),
  ]);

  const events = [];

  if (wantType('fork_created')) {
    for (const f of forks) {
      events.push({
        id: `fork_created_${f._id}`,
        type: 'fork_created',
        date: f.createdAt.toISOString(),
        description: `Створено форк: "${f.title}".`,
        lawId: f.lawId?._id?.toString() || '',
        lawLabel: f.lawId?.title || f.lawId?.number || 'Закон',
        status: 'draft',
      });
    }
  }

  if (wantType('fork_submitted')) {
    for (const f of forks) {
      if (!f.submittedAt) continue;
      events.push({
        id: `fork_submitted_${f._id}`,
        type: 'fork_submitted',
        date: f.submittedAt.toISOString(),
        description: `Форк передано на розгляд: "${f.title}".`,
        lawId: f.lawId?._id?.toString() || '',
        lawLabel: f.lawId?.title || f.lawId?.number || 'Закон',
        status: 'submitted',
      });
    }
  }

  if (wantType('proposal_created')) {
    for (const p of proposals) {
      events.push({
        id: `proposal_created_${p._id}`,
        type: 'proposal_created',
        date: p.createdAt.toISOString(),
        description: `Подано пропозицію: "${p.title}".`,
        lawId: p.law_id?._id?.toString() || '',
        lawLabel: p.law_id?.title || p.law_id?.number || 'Закон',
      });
    }
  }

  if (wantType('proposal_approved')) {
    for (const p of proposals) {
      if (p.status !== 'approved') continue;
      events.push({
        id: `proposal_approved_${p._id}`,
        type: 'proposal_approved',
        date: p.updatedAt.toISOString(),
        description: `Пропозицію погоджено: "${p.title}".`,
        lawId: p.law_id?._id?.toString() || '',
        lawLabel: p.law_id?.title || p.law_id?.number || 'Закон',
        status: 'approved',
      });
    }
  }

  if (wantType('proposal_rejected')) {
    for (const p of proposals) {
      if (p.status !== 'rejected') continue;
      events.push({
        id: `proposal_rejected_${p._id}`,
        type: 'proposal_rejected',
        date: p.updatedAt.toISOString(),
        description: `Пропозицію відхилено: "${p.title}".`,
        lawId: p.law_id?._id?.toString() || '',
        lawLabel: p.law_id?.title || p.law_id?.number || 'Закон',
        status: 'rejected',
      });
    }
  }

  if (wantType('amendment_created')) {
    for (const a of amendments) {
      events.push({
        id: `amendment_created_${a._id}`,
        type: 'amendment_created',
        date: a.createdAt.toISOString(),
        description: `Додано поправку (${a.change_type}): ${a.context?.article_title || a.context?.element_code || '—'}.`,
        lawId: a.law_id?._id?.toString() || '',
        lawLabel: a.law_id?.title || a.law_id?.number || 'Закон',
      });
    }
  }

  if (wantType('group_joined')) {
    for (const g of groups) {
      const member = g.members.find(
        (m) => m.userId?.toString() === oid.toString(),
      );
      if (!member?.joinedAt) continue;
      events.push({
        id: `group_joined_${g._id}`,
        type: 'group_joined',
        date: member.joinedAt.toISOString(),
        description: `Вас додано до навчальної групи «${g.name}».`,
        lawId: '',
        lawLabel: '',
      });
    }
  }

  events.sort((a, b) => new Date(b.date) - new Date(a.date));

  const total = events.length;
  const pg = Math.max(1, parseInt(page));
  const lim = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pg - 1) * lim;

  return {
    items: events.slice(skip, skip + lim),
    total,
    page: pg,
    pages: Math.max(1, Math.ceil(total / lim)),
    limit: lim,
    kpi: {
      forks: kpiForks,
      proposals: kpiProposals,
      amendments: kpiAmendments,
    },
  };
}
