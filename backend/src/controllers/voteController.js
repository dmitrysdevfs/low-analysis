import * as voteService from '../services/voteService.js';

export const castVote = async (req, res, next) => {
  try {
    const summary = await voteService.castVote({
      ...req.body,
      user_id: req.user._id,
    });
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

export const getVoteSummary = async (req, res, next) => {
  try {
    const summary = await voteService.getVoteSummary(req.params.amendmentId);
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

export const getUserVote = async (req, res, next) => {
  try {
    const vote = await voteService.getUserVote(
      req.params.amendmentId,
      req.user._id,
    );
    res.json(vote);
  } catch (error) {
    next(error);
  }
};
