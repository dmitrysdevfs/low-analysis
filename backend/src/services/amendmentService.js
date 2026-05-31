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
  const element = await Element.findById(element_id);
  if (!element) {
    throw new Error('Element not found');
  }

  // Build context breadcrumb
  const context = {
    element_code: element.code,
  };

  // Find article and section parents
  let current = element;
  while (current) {
    if (current.type === 'article') {
      context.article_num = current.number;
      context.article_title = current.title;
    } else if (current.type === 'section') {
      context.section_title = current.title;
    }

    if (current.parentId) {
      current = await Element.findById(current.parentId);
    } else {
      current = null;
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
  return await Amendment.find({ law_id: lawId }).populate('created_by', 'fullName');
};

/**
 * Get amendments by user ID.
 */
export const getAmendmentsByUser = async (userId) => {
  return await Amendment.find({ created_by: userId }).populate('law_id', 'title');
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
