import * as amendmentService from '../services/amendmentService.js';

export const createAmendment = async (req, res, next) => {
  try {
    const amendment = await amendmentService.createAmendment({
      ...req.body,
      created_by: req.user._id,
    });
    res.status(201).json(amendment);
  } catch (error) {
    next(error);
  }
};

export const getAmendments = async (req, res, next) => {
  try {
    const { lawId, proposalId, userId } = req.query;
    let amendments;

    if (proposalId) {
      amendments = await amendmentService.getAmendmentsByProposal(proposalId);
    } else if (lawId) {
      amendments = await amendmentService.getAmendmentsByLaw(lawId);
    } else if (userId) {
      amendments = await amendmentService.getAmendmentsByUser(userId);
    } else {
      amendments = await amendmentService.getAmendmentsByUser(req.user._id);
    }

    res.json(amendments);
  } catch (error) {
    next(error);
  }
};

export const getAmendmentById = async (req, res, next) => {
  try {
    const amendment = await amendmentService.getAmendmentById(req.params.id);
    res.json(amendment);
  } catch (error) {
    next(error);
  }
};

export const updateAmendment = async (req, res, next) => {
  try {
    const amendment = await amendmentService.updateAmendment(
      req.params.id,
      req.user._id,
      req.body,
    );
    res.json(amendment);
  } catch (error) {
    next(error);
  }
};

export const deleteAmendment = async (req, res, next) => {
  try {
    await amendmentService.deleteAmendment(req.params.id, req.user._id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
