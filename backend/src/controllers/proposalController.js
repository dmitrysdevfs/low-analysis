import * as proposalService from '../services/proposalService.js';

export const createProposal = async (req, res, next) => {
  try {
    const proposal = await proposalService.createProposal({
      ...req.body,
      created_by: req.user._id,
    });
    res.status(201).json(proposal);
  } catch (error) {
    next(error);
  }
};

export const getProposals = async (req, res, next) => {
  try {
    const { lawId, userId } = req.query;
    let proposals;

    if (userId) {
      proposals = await proposalService.getProposalsByUser(userId);
    } else if (lawId) {
      proposals = await proposalService.getProposalsByLaw(lawId);
    } else {
      proposals = await proposalService.getProposalsByUser(req.user._id);
    }

    res.json(proposals);
  } catch (error) {
    next(error);
  }
};

export const getProposalById = async (req, res, next) => {
  try {
    const proposal = await proposalService.getProposalById(req.params.id);
    res.json(proposal);
  } catch (error) {
    next(error);
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
  } catch (error) {
    next(error);
  }
};

export const submitProposal = async (req, res, next) => {
  try {
    const proposal = await proposalService.submitProposal(
      req.params.id,
      req.user._id,
    );
    res.json(proposal);
  } catch (error) {
    next(error);
  }
};

export const generateDocument = async (req, res, next) => {
  try {
    const doc = await proposalService.generateDocument(req.params.id);
    res.json(doc);
  } catch (error) {
    next(error);
  }
};
