import * as voteService from '../../services/lawChange/vote.service.js';

export const castVote = async (req, res, next) => {
  try {
    const { vote } = req.body;
    if (!['for', 'against'].includes(vote)) {
      return res
        .status(400)
        .json({ message: 'vote must be "for" or "against"' });
    }
    const proposal = await voteService.castVote(
      req.params.proposalId,
      req.user,
      vote,
    );
    res.json(proposal);
  } catch (err) {
    next(err);
  }
};

export const removeVote = async (req, res, next) => {
  try {
    const proposal = await voteService.removeVote(
      req.params.proposalId,
      req.user._id,
    );
    res.json(proposal);
  } catch (err) {
    next(err);
  }
};

export const getVoteStats = async (req, res, next) => {
  try {
    const stats = await voteService.getVoteStats(
      req.params.proposalId,
      req.user._id,
    );
    res.json(stats);
  } catch (err) {
    next(err);
  }
};
