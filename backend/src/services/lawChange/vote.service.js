import LawChangeVote from '../../models/LawChangeVote.js';
import LawChangeProposal from '../../models/LawChangeProposal.js';
import ApprovedChange from '../../models/ApprovedChange.js';
import {
  calculateVoteWeight,
  checkApprovalThreshold,
} from './voteThreshold.service.js';

/**
 * Recalculate and persist weighted vote totals on a proposal.
 */
async function recalcVotes(proposal_id) {
  const votes = await LawChangeVote.find({ proposal_id });
  let for_w = 0,
    against_w = 0,
    for_c = 0,
    against_c = 0;
  for (const v of votes) {
    if (v.vote === 'for') {
      for_w += v.vote_weight;
      for_c++;
    } else {
      against_w += v.vote_weight;
      against_c++;
    }
  }
  await LawChangeProposal.findByIdAndUpdate(proposal_id, {
    votes_for_weighted: for_w,
    votes_against_weighted: against_w,
    votes_for_count: for_c,
    votes_against_count: against_c,
  });
  return await LawChangeProposal.findById(proposal_id);
}

/**
 * Approve proposal and create ApprovedChange record.
 */
async function approveProposal(proposal) {
  // Mark previous current ApprovedChange for this element as not current
  if (proposal.element_id) {
    await ApprovedChange.updateMany(
      { element_id: proposal.element_id, is_current: true },
      { is_current: false },
    );
  }

  await ApprovedChange.create({
    law_id: proposal.law_id,
    element_id: proposal.element_id,
    winning_proposal_id: proposal._id,
    change_type: proposal.change_type,
    element_type: proposal.element_type,
    new_text: proposal.proposed_text,
    move_after_element_id: proposal.move_after_element_id,
    votes_for_weighted: proposal.votes_for_weighted,
    votes_against_weighted: proposal.votes_against_weighted,
    iteration: proposal.iteration,
    parent_element_id: proposal.parent_element_id,
    is_current: true,
    status: 'active',
  });

  proposal.status = 'approved';
  await proposal.save();
}

export const castVote = async (proposal_id, user, vote) => {
  if (user.role === 'admin')
    throw Object.assign(new Error('Admins cannot vote'), { status: 403 });

  const proposal = await LawChangeProposal.findById(proposal_id);
  if (!proposal)
    throw Object.assign(new Error('Proposal not found'), { status: 404 });
  if (proposal.status !== 'active')
    throw Object.assign(
      new Error('Voting is only allowed on active proposals'),
      { status: 400 },
    );

  const vote_weight = calculateVoteWeight(user.role);

  await LawChangeVote.findOneAndUpdate(
    { proposal_id, user_id: user._id },
    { vote, vote_weight },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const updated = await recalcVotes(proposal_id);

  if (checkApprovalThreshold(updated)) {
    await approveProposal(updated);
  }

  return await LawChangeProposal.findById(proposal_id);
};

export const removeVote = async (proposal_id, userId) => {
  const proposal = await LawChangeProposal.findById(proposal_id);
  if (!proposal)
    throw Object.assign(new Error('Proposal not found'), { status: 404 });
  if (proposal.status !== 'active')
    throw Object.assign(
      new Error('Cannot remove vote on non-active proposal'),
      { status: 400 },
    );

  await LawChangeVote.findOneAndDelete({ proposal_id, user_id: userId });
  return await recalcVotes(proposal_id);
};

export const getVoteStats = async (proposal_id, userId) => {
  const proposal = await LawChangeProposal.findById(proposal_id).lean();
  if (!proposal)
    throw Object.assign(new Error('Proposal not found'), { status: 404 });

  const myVote = userId
    ? await LawChangeVote.findOne({ proposal_id, user_id: userId }).lean()
    : null;

  return {
    votes_for_weighted: proposal.votes_for_weighted,
    votes_against_weighted: proposal.votes_against_weighted,
    votes_for_count: proposal.votes_for_count,
    votes_against_count: proposal.votes_against_count,
    my_vote: myVote ? myVote.vote : null,
  };
};
