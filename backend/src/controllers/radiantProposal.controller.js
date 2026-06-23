import * as service from '../services/radiantProposal.service.js';

export const createProposal = async (req, res, next) => {
  try {
    const proposal = await service.createProposal({
      ...req.body,
      created_by: req.user._id,
      author_display_name: req.user.fullName,
    });
    res.status(201).json(proposal);
  } catch (err) { next(err); }
};

export const getProposals = async (req, res, next) => {
  try {
    const { status, proposal_type, page, limit } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (proposal_type) filters.proposal_type = proposal_type;

    const pagination =
      page && limit
        ? { page: parseInt(page, 10), limit: parseInt(limit, 10) }
        : null;

    const result = await service.getProposals(filters, pagination);
    res.json(result);
  } catch (err) { next(err); }
};

export const getMyProposals = async (req, res, next) => {
  try {
    const proposals = await service.getMyProposals(req.user._id);
    res.json(proposals);
  } catch (err) { next(err); }
};

export const getProposalById = async (req, res, next) => {
  try {
    const proposal = await service.getProposalById(req.params.id);
    res.json(proposal);
  } catch (err) { next(err); }
};

export const updateProposal = async (req, res, next) => {
  try {
    const proposal = await service.updateProposal(req.params.id, req.user._id, req.body);
    res.json(proposal);
  } catch (err) { next(err); }
};

export const deleteProposal = async (req, res, next) => {
  try {
    await service.deleteProposal(req.params.id, req.user._id);
    res.status(204).end();
  } catch (err) { next(err); }
};

export const submitProposal = async (req, res, next) => {
  try {
    const proposal = await service.submitProposal(req.params.id, req.user._id);
    res.json(proposal);
  } catch (err) { next(err); }
};

export const withdrawProposal = async (req, res, next) => {
  try {
    const proposal = await service.withdrawProposal(req.params.id, req.user._id);
    res.json(proposal);
  } catch (err) { next(err); }
};

export const castVote = async (req, res, next) => {
  try {
    const { vote } = req.body;
    const proposal = await service.castVote(req.params.id, req.user, vote);
    res.json(proposal);
  } catch (err) { next(err); }
};

export const removeVote = async (req, res, next) => {
  try {
    const proposal = await service.removeVote(req.params.id, req.user._id);
    res.json(proposal);
  } catch (err) { next(err); }
};

export const getVoteStats = async (req, res, next) => {
  try {
    const stats = await service.getVoteStats(req.params.id, req.user?._id);
    res.json(stats);
  } catch (err) { next(err); }
};

export const reviewProposal = async (req, res, next) => {
  try {
    const { action } = req.body;
    const proposal = await service.reviewProposal(req.params.id, action, req.user);
    res.json(proposal);
  } catch (err) { next(err); }
};
