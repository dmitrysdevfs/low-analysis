import GraphProposal from '../models/GraphProposal.js';
import GraphProposalVote from '../models/GraphProposalVote.js';
import { calculateVoteWeight } from './lawChange/voteThreshold.service.js';
import { compareIds } from '../utils/id.js';

const VOTING_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

async function recalcVotes(proposal_id) {
  const votes = await GraphProposalVote.find({ proposal_id });
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
  await GraphProposal.findByIdAndUpdate(proposal_id, {
    votes_for_weighted: for_w,
    votes_against_weighted: against_w,
    votes_for_count: for_c,
    votes_against_count: against_c,
  });
  return await GraphProposal.findById(proposal_id);
}

export const createProposal = async (data) => {
  return await GraphProposal.create({ ...data, status: 'draft' });
};

export const getProposals = async (filters = {}, pagination = null) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.proposal_type) query.proposal_type = filters.proposal_type;

  if (pagination) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const [proposals, total] = await Promise.all([
      GraphProposal.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('created_by', 'fullName role'),
      GraphProposal.countDocuments(query),
    ]);
    return { proposals, total, page, pages: Math.ceil(total / limit) };
  }
  return await GraphProposal.find(query)
    .sort({ createdAt: -1 })
    .populate('created_by', 'fullName role');
};

export const getMyProposals = async (userId) => {
  return await GraphProposal.find({ created_by: userId }).sort({
    createdAt: -1,
  });
};

export const getProposalById = async (id) => {
  const proposal = await GraphProposal.findById(id).populate(
    'created_by',
    'fullName role',
  );
  if (!proposal)
    throw Object.assign(new Error('Proposal not found'), { status: 404 });
  return proposal;
};

export const updateProposal = async (id, userId, patch) => {
  const proposal = await GraphProposal.findById(id);
  if (!proposal)
    throw Object.assign(new Error('Proposal not found'), { status: 404 });
  if (!compareIds(proposal.created_by, userId))
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  if (proposal.status !== 'draft')
    throw Object.assign(new Error('Only draft proposals can be updated'), {
      status: 400,
    });

  const allowed = [
    'proposal_type',
    'law_id',
    'source_law_id',
    'target_law_id',
    'edge_type',
    'reason',
  ];
  allowed.forEach((key) => {
    if (patch[key] !== undefined) proposal[key] = patch[key];
  });
  return await proposal.save();
};

export const deleteProposal = async (id, userId) => {
  const proposal = await GraphProposal.findById(id);
  if (!proposal)
    throw Object.assign(new Error('Proposal not found'), { status: 404 });
  if (!compareIds(proposal.created_by, userId))
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  if (proposal.status !== 'draft')
    throw Object.assign(new Error('Only draft proposals can be deleted'), {
      status: 400,
    });
  await proposal.deleteOne();
};

export const submitProposal = async (id, userId) => {
  const proposal = await GraphProposal.findById(id);
  if (!proposal)
    throw Object.assign(new Error('Proposal not found'), { status: 404 });
  if (!compareIds(proposal.created_by, userId))
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  if (proposal.status !== 'draft')
    throw Object.assign(new Error('Only draft proposals can be submitted'), {
      status: 400,
    });
  if (!proposal.reason)
    throw Object.assign(new Error('reason is required to submit'), {
      status: 422,
    });

  proposal.status = 'active';
  proposal.voting_deadline = new Date(Date.now() + VOTING_DURATION_MS);
  return await proposal.save();
};

export const withdrawProposal = async (id, userId) => {
  const proposal = await GraphProposal.findById(id);
  if (!proposal)
    throw Object.assign(new Error('Proposal not found'), { status: 404 });
  if (!compareIds(proposal.created_by, userId))
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  if (proposal.status !== 'active')
    throw Object.assign(new Error('Only active proposals can be withdrawn'), {
      status: 400,
    });

  proposal.status = 'withdrawn';
  return await proposal.save();
};

export const castVote = async (proposalId, user, vote) => {
  if (user.role === 'admin')
    throw Object.assign(new Error('Admins cannot vote'), { status: 403 });

  const proposal = await GraphProposal.findById(proposalId);
  if (!proposal)
    throw Object.assign(new Error('Proposal not found'), { status: 404 });

  if (proposal.created_by.toString() === user._id.toString())
    throw Object.assign(new Error('Cannot vote on your own proposal'), {
      status: 403,
    });

  if (proposal.status !== 'active')
    throw Object.assign(
      new Error('Voting is only allowed on active proposals'),
      { status: 400 },
    );

  const vote_weight = calculateVoteWeight(user.role);

  await GraphProposalVote.findOneAndUpdate(
    { proposal_id: proposalId, user_id: user._id },
    { vote, vote_weight },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const updated = await recalcVotes(proposalId);

  if (
    updated.votes_for_weighted >= 10 &&
    updated.votes_for_weighted > updated.votes_against_weighted
  ) {
    updated.status = 'approved';
    await updated.save();
  }

  return await GraphProposal.findById(proposalId);
};

export const removeVote = async (proposalId, userId) => {
  const proposal = await GraphProposal.findById(proposalId);
  if (!proposal)
    throw Object.assign(new Error('Proposal not found'), { status: 404 });
  if (proposal.status !== 'active')
    throw Object.assign(
      new Error('Cannot remove vote on non-active proposal'),
      { status: 400 },
    );

  await GraphProposalVote.findOneAndDelete({
    proposal_id: proposalId,
    user_id: userId,
  });
  return await recalcVotes(proposalId);
};

export const getVoteStats = async (proposalId, userId) => {
  const proposal = await GraphProposal.findById(proposalId).lean();
  if (!proposal)
    throw Object.assign(new Error('Proposal not found'), { status: 404 });

  const myVote = userId
    ? await GraphProposalVote.findOne({
        proposal_id: proposalId,
        user_id: userId,
      }).lean()
    : null;

  return {
    votes_for_weighted: proposal.votes_for_weighted,
    votes_against_weighted: proposal.votes_against_weighted,
    votes_for_count: proposal.votes_for_count,
    votes_against_count: proposal.votes_against_count,
    my_vote: myVote ? myVote.vote : null,
  };
};

export const reviewProposal = async (id, action, _user) => {
  const proposal = await GraphProposal.findById(id);
  if (!proposal)
    throw Object.assign(new Error('Proposal not found'), { status: 404 });
  if (!['active', 'expired'].includes(proposal.status))
    throw Object.assign(
      new Error('Can only review active or expired proposals'),
      { status: 403 },
    );

  if (action === 'approve') {
    proposal.status = 'approved';
  } else if (action === 'reject') {
    proposal.status = 'rejected';
  } else {
    throw Object.assign(new Error('Invalid action. Use approve or reject'), {
      status: 400,
    });
  }

  return await proposal.save();
};
