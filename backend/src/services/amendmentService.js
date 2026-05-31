import mongoose from 'mongoose';
import Amendment from '../models/Amendment.js';
import Element from '../models/Element.js';
import Proposal from '../models/Proposal.js';

/**
 * Create a new amendment.
 * Automatically populates original_text and context from the Element.
 */
export const createAmendment = async ({
  law_id,
  element_id,
  proposal_id,
  created_by,
  change_type,
  proposed_text,
  reason,
}) => {
  const matchId = mongoose.Types.ObjectId.isValid(element_id)
    ? new mongoose.Types.ObjectId(element_id)
    : element_id;

  const results = await Element.aggregate([
    { $match: { _id: matchId } },
    {
      $graphLookup: {
        from: 'elements',
        startWith: '$parentId',
        connectFromField: 'parentId',
        connectToField: '_id',
        as: 'ancestors',
      },
    },
  ]);

  if (results.length === 0) {
    throw new Error('Element not found');
  }

  const element = results[0];
  const ancestors = element.ancestors || [];

  // Build context breadcrumb
  const context = {
    element_code: element.code,
  };

  // Find article and section parents from ancestors array and the element itself
  const allElements = [element, ...ancestors];
  for (const item of allElements) {
    if (item.type === 'article') {
      context.article_num = item.number;
      context.article_title = item.title;
    } else if (item.type === 'section') {
      context.section_title = item.title;
    }
  }

  const amendment = await Amendment.create({
    law_id,
    element_id,
    proposal_id,
    created_by,
    change_type,
    original_text: element.text || element.title,
    proposed_text,
    reason,
    context,
  });

  if (proposal_id) {
    await Proposal.findByIdAndUpdate(proposal_id, {
      $inc: { amendments_count: 1 },
    });
  }

  return amendment;
};

/**
 * Get amendments by proposal ID.
 */
export const getAmendmentsByProposal = async (proposalId) => {
  return await Amendment.find({ proposal_id: proposalId }).sort({ order: 1 });
};

/**
 * Get amendments by law ID.
 */
export const getAmendmentsByLaw = async (lawId) => {
  return await Amendment.find({ law_id: lawId }).populate(
    'created_by',
    'fullName',
  );
};

/**
 * Get amendments by user ID.
 */
export const getAmendmentsByUser = async (userId) => {
  return await Amendment.find({ created_by: userId }).populate(
    'law_id',
    'title',
  );
};

/**
 * Get amendment by ID.
 */
export const getAmendmentById = async (id) => {
  return await Amendment.findById(id).populate('created_by', 'fullName');
};

/**
 * Update amendment - only author and only if proposal is in draft.
 */
export const updateAmendment = async (id, userId, data) => {
  const amendment = await Amendment.findById(id);
  if (!amendment) throw new Error('Amendment not found');

  if (amendment.created_by.toString() !== userId.toString()) {
    throw new Error('Not authorized to update this amendment');
  }

  if (amendment.proposal_id) {
    const proposal = await Proposal.findById(amendment.proposal_id);
    if (proposal && proposal.status !== 'draft') {
      throw new Error('Cannot update amendment in a non-draft proposal');
    }
  }

  return await Amendment.findByIdAndUpdate(id, data, { new: true });
};

/**
 * Delete amendment - only author and only if proposal is in draft.
 */
export const deleteAmendment = async (id, userId) => {
  const amendment = await Amendment.findById(id);
  if (!amendment) throw new Error('Amendment not found');

  if (amendment.created_by.toString() !== userId.toString()) {
    throw new Error('Not authorized to delete this amendment');
  }

  if (amendment.proposal_id) {
    const proposal = await Proposal.findById(amendment.proposal_id);
    if (proposal && proposal.status !== 'draft') {
      throw new Error('Cannot delete amendment in a non-draft proposal');
    }

    await Proposal.findByIdAndUpdate(amendment.proposal_id, {
      $inc: { amendments_count: -1 },
    });
  }

  return await Amendment.findByIdAndDelete(id);
};
