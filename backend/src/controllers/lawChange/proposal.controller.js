import * as proposalService from '../../services/lawChange/proposal.service.js';

export const createProposal = async (req, res, next) => {
  try {
    const proposal = await proposalService.createProposal({
      ...req.body,
      created_by: req.user._id,
      author_display_name: req.user.fullName,
    });
    res.status(201).json(proposal);
  } catch (err) { next(err); }
};

export const getProposals = async (req, res, next) => {
  try {
    const { law_id, element_id, status } = req.query;
    const filters = {};
    if (element_id) filters.element_id = element_id;
    if (status) filters.status = status;

    if (!law_id) return res.status(400).json({ message: 'law_id query param is required' });
    const proposals = await proposalService.getProposalsByLaw(law_id, filters);
    res.json(proposals);
  } catch (err) { next(err); }
};

export const getMyProposals = async (req, res, next) => {
  try {
    const proposals = await proposalService.getMyProposals(req.user._id);
    res.json(proposals);
  } catch (err) { next(err); }
};

export const getProposalById = async (req, res, next) => {
  try {
    const proposal = await proposalService.getProposalById(req.params.id);
    res.json(proposal);
  } catch (err) { next(err); }
};

export const updateProposal = async (req, res, next) => {
  try {
    const proposal = await proposalService.updateProposal(req.params.id, req.user._id, req.body);
    res.json(proposal);
  } catch (err) { next(err); }
};

export const submitProposal = async (req, res, next) => {
  try {
    const proposal = await proposalService.submitProposal(req.params.id, req.user._id);
    res.json(proposal);
  } catch (err) { next(err); }
};

export const withdrawProposal = async (req, res, next) => {
  try {
    const proposal = await proposalService.withdrawProposal(req.params.id, req.user._id);
    res.json(proposal);
  } catch (err) { next(err); }
};
