import * as proposalService from '../../services/lawChange/proposal.service.js';

export const createProposal = async (req, res, next) => {
  try {
    const proposal = await proposalService.createProposal({
      ...req.body,
      created_by: req.user._id,
      author_display_name: req.user.fullName,
    });
    res.status(201).json(proposal);
  } catch (err) {
    next(err);
  }
};

export const getProposals = async (req, res, next) => {
  try {
    const { law_id, element_id, status, page, limit } = req.query;
    const filters = {};
    if (element_id) filters.element_id = element_id;
    if (status) filters.status = status;

    const pagination =
      page && limit
        ? { page: parseInt(page, 10), limit: parseInt(limit, 10) }
        : null;

    if (law_id) {
      const proposals = await proposalService.getProposalsByLaw(
        law_id,
        filters,
      );
      res.json(proposals);
    } else {
      const result = await proposalService.getAllProposals(filters, pagination);
      res.json(result);
    }
  } catch (err) {
    next(err);
  }
};

export const getMyProposals = async (req, res, next) => {
  try {
    const proposals = await proposalService.getMyProposals(req.user._id);
    res.json(proposals);
  } catch (err) {
    next(err);
  }
};

export const getProposalById = async (req, res, next) => {
  try {
    const proposal = await proposalService.getProposalById(req.params.id);
    res.json(proposal);
  } catch (err) {
    next(err);
  }
};

export const updateProposal = async (req, res, next) => {
  try {
    const proposal = await proposalService.updateProposal(
      req.params.id,
      req.user._id,
      req.body,
    );
    res.json(proposal);
  } catch (err) {
    next(err);
  }
};

export const submitProposal = async (req, res, next) => {
  try {
    const proposal = await proposalService.submitProposal(
      req.params.id,
      req.user._id,
    );
    res.json(proposal);
  } catch (err) {
    next(err);
  }
};

export const withdrawProposal = async (req, res, next) => {
  try {
    const proposal = await proposalService.withdrawProposal(
      req.params.id,
      req.user._id,
    );
    res.json(proposal);
  } catch (err) {
    next(err);
  }
};

export const deleteProposal = async (req, res, next) => {
  try {
    await proposalService.deleteProposal(req.params.id, req.user._id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const reviewProposal = async (req, res, next) => {
  try {
    const { action } = req.body; // 'approve' | 'reject'
    const proposal = await proposalService.reviewProposal(
      req.params.id,
      action,
      req.user,
    );
    res.json(proposal);
  } catch (err) {
    next(err);
  }
};
