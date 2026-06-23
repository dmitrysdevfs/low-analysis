import * as supervisorService from '../services/supervisor.service.js';
import * as proposalService from '../services/proposalService.js';
import * as amendmentService from '../services/amendmentService.js';
import * as forkService from '../services/forkService.js';
import * as analyticsService from '../services/analyticsService.js';
import * as historyService from '../services/historyService.js';
import Group from '../models/Group.js';

export const getDashboard = async (req, res, next) => {
  try {
    const summary = await supervisorService.getDashboardSummary(req.user._id);
    res.json(summary);
  } catch (err) {
    next(err);
  }
};

export const getGroups = async (req, res, next) => {
  try {
    const groups = await supervisorService.getGroupsBySupervisor(req.user._id);
    res.json(groups);
  } catch (err) {
    next(err);
  }
};

export const createGroup = async (req, res, next) => {
  try {
    const group = await supervisorService.createGroup(req.user._id, req.body);
    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
};

export const getGroup = async (req, res, next) => {
  try {
    const group = await supervisorService.getGroupById(
      req.params.id,
      req.user._id,
    );
    res.json(group);
  } catch (err) {
    next(err);
  }
};

export const updateGroup = async (req, res, next) => {
  try {
    const group = await supervisorService.updateGroup(
      req.params.id,
      req.user._id,
      req.body,
    );
    res.json(group);
  } catch (err) {
    next(err);
  }
};

// Helper: collect supervisor + all active member IDs from all groups
const getSupervisorMemberIds = async (supervisorId) => {
  const groups = await Group.find({ supervisorId });
  const memberIds = groups.flatMap((g) =>
    g.members.filter((m) => m.status === 'active').map((m) => m.userId),
  );
  memberIds.push(supervisorId);
  return memberIds;
};

export const getGroupProposals = async (req, res, next) => {
  try {
    const memberIds = await getSupervisorMemberIds(req.user._id);
    const proposals = await proposalService.getProposalsByUserIds(memberIds);
    res.json(proposals);
  } catch (err) {
    next(err);
  }
};

export const getGroupAmendments = async (req, res, next) => {
  try {
    const memberIds = await getSupervisorMemberIds(req.user._id);
    const amendments = await amendmentService.getAmendmentsByUserIds(memberIds);
    res.json(amendments);
  } catch (err) {
    next(err);
  }
};

export const getGroupForks = async (req, res, next) => {
  try {
    const memberIds = await getSupervisorMemberIds(req.user._id);
    const forks = await forkService.getForksByUserIds(memberIds);
    res.json(forks);
  } catch (err) {
    next(err);
  }
};

export const reviewGroupFork = async (req, res, next) => {
  try {
    const { forkId } = req.params;
    const { action, reviewNote } = req.body;
    if (action !== 'approve' && action !== 'reject') {
      return res
        .status(400)
        .json({ message: 'action must be approve or reject' });
    }
    const fork = await forkService.reviewFork(forkId, action, reviewNote);
    res.json(fork);
  } catch (err) {
    next(err);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const period = req.query.period || 'month';
    const data = await analyticsService.getSupervisorAnalytics(
      req.user._id,
      period,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const { from, to, type, page, limit } = req.query;
    const data = await historyService.getSupervisorHistory(req.user._id, {
      from,
      to,
      type,
      page,
      limit,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getSupervisorChanges = async (req, res, next) => {
  try {
    const memberIds = await getSupervisorMemberIds(req.user._id);
    const [forks, proposals, amendments] = await Promise.all([
      forkService.getForksByUserIds(memberIds),
      proposalService.getProposalsByUserIds(memberIds),
      amendmentService.getAmendmentsByUserIds(memberIds),
    ]);

    const forkEntries = forks.map((f) => ({
      _id: f._id,
      type: 'fork',
      title: f.title,
      lawTitle: f.lawId?.title ?? '',
      lawCode: f.lawId?.code ?? '',
      status: f.status,
      authorName: f.authorId?.fullName ?? '',
      createdAt: f.createdAt,
    }));

    const proposalEntries = proposals.map((p) => ({
      _id: p._id,
      type: 'proposal',
      title: p.title,
      lawTitle: typeof p.law_id === 'object' ? (p.law_id?.title ?? '') : '',
      lawCode: typeof p.law_id === 'object' ? (p.law_id?.code ?? '') : '',
      status: p.status,
      authorName:
        typeof p.created_by === 'object' ? (p.created_by?.fullName ?? '') : '',
      createdAt: p.createdAt,
    }));

    const amendmentEntries = amendments.map((a) => ({
      _id: a._id,
      type: 'amendment',
      title: `Поправка: ст. ${a.context?.article_num ?? '—'} (${a.change_type})`,
      lawTitle: typeof a.law_id === 'object' ? (a.law_id?.title ?? '—') : '—',
      lawCode: '—',
      status: null,
      authorName:
        typeof a.created_by === 'object' ? (a.created_by?.fullName ?? '') : '',
      createdAt: a.createdAt,
    }));

    const all = [...forkEntries, ...proposalEntries, ...amendmentEntries];
    all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(all);
  } catch (err) {
    next(err);
  }
};
