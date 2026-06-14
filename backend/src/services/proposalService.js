import Proposal from '../models/Proposal.js';
import Amendment from '../models/Amendment.js';
import { compareIds } from '../utils/id.js';

/**
 * Create a new proposal.
 */
export const createProposal = async ({
  law_id,
  created_by,
  title,
  description,
}) => {
  return await Proposal.create({ law_id, created_by, title, description });
};

// Helper to sync amendments count for a list of proposals in a single batch aggregation (resolves N+1 query issue)
const syncProposalsAmendmentsCount = async (proposals) => {
  if (!proposals || proposals.length === 0) return proposals;

  const proposalIds = proposals.map((p) => p._id);
  const counts = await Amendment.aggregate([
    { $match: { proposal_id: { $in: proposalIds } } },
    { $group: { _id: '$proposal_id', count: { $sum: 1 } } },
  ]);

  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

  const stale = proposals.filter(
    (p) => (countMap.get(p._id.toString()) || 0) !== p.amendments_count,
  );

  if (stale.length > 0) {
    await Proposal.bulkWrite(
      stale.map((p) => ({
        updateOne: {
          filter: { _id: p._id },
          update: {
            $set: { amendments_count: countMap.get(p._id.toString()) || 0 },
          },
        },
      })),
    );
    for (const p of proposals) {
      p.amendments_count = countMap.get(p._id.toString()) || 0;
    }
  }

  return proposals;
};

/**
 * Get proposals by user ID.
 */
export const getProposalsByUser = async (userId) => {
  const proposals = await Proposal.find({ created_by: userId }).populate(
    'law_id',
    'title',
  );

  return await syncProposalsAmendmentsCount(proposals);
};

/**
 * Get proposals by law ID.
 */
export const getProposalsByLaw = async (lawId) => {
  const proposals = await Proposal.find({ law_id: lawId }).populate(
    'created_by',
    'fullName',
  );

  return await syncProposalsAmendmentsCount(proposals);
};

/**
 * Get proposal by ID with populated amendments.
 */
export const getProposalById = async (id) => {
  const proposal = await Proposal.findById(id).populate(
    'created_by',
    'fullName',
  );
  if (!proposal) throw new Error('Proposal not found');

  const amendments = await Amendment.find({ proposal_id: id });

  // Sync count on individual fetch too
  if (proposal.amendments_count !== amendments.length) {
    proposal.amendments_count = amendments.length;
    await proposal.save();
  }

  return { ...proposal.toObject(), amendments };
};

/**
 * Update proposal - only author and only if in draft.
 */
export const updateProposal = async (id, userId, data) => {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new Error('Proposal not found');

  if (!compareIds(proposal.created_by, userId)) {
    throw new Error('Not authorized to update this proposal');
  }

  if (proposal.status !== 'draft') {
    throw new Error('Cannot update a non-draft proposal');
  }

  return await Proposal.findByIdAndUpdate(id, data, { new: true });
};

/**
 * Delete a draft proposal and cascade-delete its amendments.
 */
export const deleteProposal = async (id, userId) => {
  const proposal = await Proposal.findById(id);
  if (!proposal)
    throw Object.assign(new Error('Proposal not found'), { statusCode: 404 });

  if (!compareIds(proposal.created_by, userId))
    throw Object.assign(new Error('Not authorized to delete this proposal'), {
      statusCode: 403,
    });

  if (proposal.status !== 'draft')
    throw Object.assign(new Error('Only draft proposals can be deleted'), {
      statusCode: 400,
    });

  await Amendment.deleteMany({ proposal_id: id });
  await proposal.deleteOne();
};

/**
 * Submit proposal - change status to 'review'.
 */
export const submitProposal = async (id, userId) => {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new Error('Proposal not found');

  if (!compareIds(proposal.created_by, userId)) {
    throw new Error('Not authorized to submit this proposal');
  }

  if (proposal.status !== 'draft') {
    throw new Error('Proposal is already submitted or processed');
  }

  proposal.status = 'review';
  return await proposal.save();
};

/**
 * Generate a structured document for the proposal.
 */
export const generateDocument = async (id) => {
  const proposal = await Proposal.findById(id).populate('law_id');
  if (!proposal) throw new Error('Proposal not found');

  const amendments = await Amendment.find({ proposal_id: id });

  return {
    proposal_info: {
      title: proposal.title,
      description: proposal.description,
      status: proposal.status,
    },
    law_info: {
      title: proposal.law_id.title,
      code: proposal.law_id.code,
    },
    amendments: amendments.map((a) => ({
      change_type: a.change_type,
      original_text: a.original_text,
      proposed_text: a.proposed_text,
      reason: a.reason,
      context: a.context,
    })),
  };
};
