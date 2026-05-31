import Proposal from '../models/Proposal.js';
import Amendment from '../models/Amendment.js';

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

/**
 * Get proposals by user ID.
 */
export const getProposalsByUser = async (userId) => {
  const proposals = await Proposal.find({ created_by: userId }).populate(
    'law_id',
    'title',
  );

  return await Promise.all(
    proposals.map(async (p) => {
      const count = await Amendment.countDocuments({ proposal_id: p._id });
      if (p.amendments_count !== count) {
        p.amendments_count = count;
        await p.save();
      }
      return p;
    }),
  );
};

/**
 * Get proposals by law ID.
 */
export const getProposalsByLaw = async (lawId) => {
  const proposals = await Proposal.find({ law_id: lawId }).populate(
    'created_by',
    'fullName',
  );

  return await Promise.all(
    proposals.map(async (p) => {
      const count = await Amendment.countDocuments({ proposal_id: p._id });
      if (p.amendments_count !== count) {
        p.amendments_count = count;
        await p.save();
      }
      return p;
    }),
  );
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

  if (proposal.created_by.toString() !== userId.toString()) {
    throw new Error('Not authorized to update this proposal');
  }

  if (proposal.status !== 'draft') {
    throw new Error('Cannot update a non-draft proposal');
  }

  return await Proposal.findByIdAndUpdate(id, data, { new: true });
};

/**
 * Submit proposal - change status to 'review'.
 */
export const submitProposal = async (id, userId) => {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new Error('Proposal not found');

  if (proposal.created_by.toString() !== userId.toString()) {
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
