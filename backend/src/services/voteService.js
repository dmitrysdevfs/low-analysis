import mongoose from 'mongoose';
import Vote from '../models/Vote.js';
import Amendment from '../models/Amendment.js';
import Proposal from '../models/Proposal.js';

const castToObjectId = (id) => {
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
};

/**
 * Cast or update a vote on an amendment.
 */
export const castVote = async ({ amendment_id, user_id, value }) => {
  const amendmentObjectId = castToObjectId(amendment_id);
  const userObjectId = castToObjectId(user_id);

  // Upsert the vote
  await Vote.findOneAndUpdate(
    { amendment_id: amendmentObjectId, user_id: userObjectId },
    { value },
    { upsert: true, new: true },
  );

  // Recalculate Amendment votes_summary
  const amendmentStats = await Vote.aggregate([
    { $match: { amendment_id: amendmentObjectId } },
    { $group: { _id: '$value', count: { $sum: 1 } } },
  ]);

  const summary = { positive: 0, neutral: 0, negative: 0 };
  amendmentStats.forEach((stat) => {
    summary[stat._id] = stat.count;
  });

  const amendment = await Amendment.findByIdAndUpdate(
    amendmentObjectId,
    { votes_summary: summary },
    { new: true },
  );

  // Recalculate Proposal votes_summary if applicable
  if (amendment && amendment.proposal_id) {
    const proposalStats = await Amendment.aggregate([
      { $match: { proposal_id: amendment.proposal_id } },
      {
        $group: {
          _id: null,
          positive: { $sum: '$votes_summary.positive' },
          neutral: { $sum: '$votes_summary.neutral' },
          negative: { $sum: '$votes_summary.negative' },
        },
      },
    ]);

    if (proposalStats.length > 0) {
      const { positive, neutral, negative } = proposalStats[0];
      await Proposal.findByIdAndUpdate(amendment.proposal_id, {
        votes_summary: { positive, neutral, negative },
      });
    }
  }

  return summary;
};

/**
 * Get vote summary for an amendment.
 */
export const getVoteSummary = async (amendmentId) => {
  const amendment = await Amendment.findById(amendmentId);
  return amendment ? amendment.votes_summary : null;
};

/**
 * Get a specific user's vote for an amendment.
 */
export const getUserVote = async (amendmentId, userId) => {
  return await Vote.findOne({ amendment_id: amendmentId, user_id: userId });
};
