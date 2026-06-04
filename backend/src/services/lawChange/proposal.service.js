import LawChangeProposal from '../../models/LawChangeProposal.js';
import { compareIds } from '../../utils/id.js';

const VOTING_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export const createProposal = async ({ law_id, element_id = null, parent_element_id = null, change_type, element_type = null, original_text = '', proposed_text = null, move_after_element_id = null, reason = '', created_by, author_display_name }) => {
  return await LawChangeProposal.create({
    law_id, element_id, parent_element_id, change_type, element_type,
    original_text, proposed_text, move_after_element_id, reason,
    created_by, author_display_name, status: 'draft',
  });
};

export const updateProposal = async (id, userId, updates) => {
  const proposal = await LawChangeProposal.findById(id);
  if (!proposal) throw Object.assign(new Error('Proposal not found'), { status: 404 });
  if (!compareIds(proposal.created_by, userId)) throw Object.assign(new Error('Forbidden'), { status: 403 });
  if (proposal.status !== 'draft') throw Object.assign(new Error('Only draft proposals can be updated'), { status: 400 });

  const allowed = ['proposed_text', 'reason', 'original_text', 'move_after_element_id', 'element_type'];
  allowed.forEach((key) => { if (updates[key] !== undefined) proposal[key] = updates[key]; });
  return await proposal.save();
};

export const submitProposal = async (id, userId) => {
  const proposal = await LawChangeProposal.findById(id);
  if (!proposal) throw Object.assign(new Error('Proposal not found'), { status: 404 });
  if (!compareIds(proposal.created_by, userId)) throw Object.assign(new Error('Forbidden'), { status: 403 });
  if (proposal.status !== 'draft') throw Object.assign(new Error('Only draft proposals can be submitted'), { status: 400 });
  if (!proposal.reason) throw Object.assign(new Error('reason is required to submit'), { status: 422 });

  // Check for conflicting active proposal on the same element
  if (proposal.element_id) {
    const conflict = await LawChangeProposal.findOne({
      law_id: proposal.law_id,
      element_id: proposal.element_id,
      status: 'active',
    });
    if (conflict) throw Object.assign(new Error('Another active proposal exists for this element'), { status: 409 });
  }

  proposal.status = 'active';
  proposal.voting_deadline = new Date(Date.now() + VOTING_DURATION_MS);
  return await proposal.save();
};

export const withdrawProposal = async (id, userId) => {
  const proposal = await LawChangeProposal.findById(id);
  if (!proposal) throw Object.assign(new Error('Proposal not found'), { status: 404 });
  if (!compareIds(proposal.created_by, userId)) throw Object.assign(new Error('Forbidden'), { status: 403 });
  if (!['draft', 'active'].includes(proposal.status)) throw Object.assign(new Error('Cannot withdraw in current status'), { status: 400 });

  proposal.status = 'withdrawn';
  return await proposal.save();
};

export const getProposalById = async (id) => {
  const proposal = await LawChangeProposal.findById(id).populate('created_by', 'fullName role');
  if (!proposal) throw Object.assign(new Error('Proposal not found'), { status: 404 });
  return proposal;
};

export const getProposalsByLaw = async (law_id, filters = {}) => {
  const query = { law_id, ...filters };
  return await LawChangeProposal.find(query).sort({ createdAt: -1 }).populate('created_by', 'fullName role');
};

export const getProposalsForElement = async (law_id, element_id) => {
  return await LawChangeProposal.find({ law_id, element_id }).sort({ createdAt: -1 });
};

export const getMyProposals = async (userId) => {
  return await LawChangeProposal.find({ created_by: userId }).sort({ createdAt: -1 }).populate('law_id', 'title code');
};
