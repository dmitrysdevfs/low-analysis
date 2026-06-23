import mongoose from 'mongoose';
import Amendment from '../models/Amendment.js';
import Element from '../models/Element.js';
import Proposal from '../models/Proposal.js';
import { compareIds } from '../utils/id.js';

/**
 * Create a new amendment.
 * If element_id is provided, auto-populates original_text and context from Element.
 * If element_id is omitted (cabinet form), uses context/original_text from request directly.
 */
export const createAmendment = async ({
  law_id,
  element_id,
  proposal_id,
  created_by,
  change_type,
  original_text: originalTextInput,
  proposed_text,
  reason,
  context: contextInput,
}) => {
  let context = contextInput || {};
  let original_text = originalTextInput || null;

  // Only look up Element if element_id is provided
  if (element_id && mongoose.Types.ObjectId.isValid(element_id)) {
    const matchId = new mongoose.Types.ObjectId(element_id);
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

    if (results.length === 0) throw new Error('Element not found');

    const element = results[0];
    const ancestors = element.ancestors || [];
    context = { element_code: element.code };

    const allElements = [element, ...ancestors];
    for (const item of allElements) {
      if (item.type === 'article') {
        context.article_num = item.number;
        context.article_title = item.title;
      } else if (item.type === 'section') {
        context.section_title = item.title;
      }
    }

    if (change_type === 'edit' || change_type === 'delete') {
      original_text = element.text || element.title;
    }
  }

  const amendment = await Amendment.create({
    law_id: law_id || null,
    element_id: element_id || null,
    proposal_id: proposal_id || null,
    created_by,
    change_type,
    original_text,
    proposed_text: change_type === 'edit' || change_type === 'add' ? proposed_text : null,
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

  if (!compareIds(amendment.created_by, userId)) {
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
 * Get amendments by multiple user IDs (for supervisor group view).
 */
export const getAmendmentsByUserIds = async (userIds) => {
  return Amendment.find({ created_by: { $in: userIds } })
    .populate('law_id', 'title code')
    .populate('created_by', 'fullName')
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Delete amendment - only author and only if proposal is in draft.
 */
export const deleteAmendment = async (id, userId) => {
  const amendment = await Amendment.findById(id);
  if (!amendment) throw new Error('Amendment not found');

  if (!compareIds(amendment.created_by, userId)) {
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
