import mongoose from 'mongoose';

const lawChangeProposalSchema = new mongoose.Schema(
  {
    law_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Law', required: true, index: true },
    element_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Element', default: null }, // null for ADD
    parent_element_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Element', default: null }, // required for ADD
    change_type: { type: String, enum: ['edit', 'add', 'delete', 'move'], required: true },
    element_type: { type: String, enum: ['article', 'clause', 'point', 'subpoint'], default: null },
    original_text: { type: String, default: '' }, // snapshot at proposal time
    proposed_text: { type: String, default: null }, // null for delete
    move_after_element_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Element', default: null }, // for move
    reason: { type: String, default: '' }, // required at submit, optional for draft
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    author_display_name: { type: String, default: '' }, // cached, always public
    status: {
      type: String,
      enum: ['draft', 'active', 'approved', 'rejected', 'withdrawn', 'archived', 'superseded'],
      default: 'draft',
      index: true,
    },
    votes_for_weighted: { type: Number, default: 0 },
    votes_against_weighted: { type: Number, default: 0 },
    votes_for_count: { type: Number, default: 0 },
    votes_against_count: { type: Number, default: 0 },
    based_on_change_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovedChange', default: null },
    iteration: { type: Number, default: 0 },
    voting_deadline: { type: Date, default: null },
  },
  { timestamps: true },
);

// Compound indexes
lawChangeProposalSchema.index({ law_id: 1, element_id: 1, status: 1 });
lawChangeProposalSchema.index({ created_by: 1, status: 1 });
lawChangeProposalSchema.index({ voting_deadline: 1, status: 1 });

const LawChangeProposal = mongoose.model('LawChangeProposal', lawChangeProposalSchema);
export default LawChangeProposal;
