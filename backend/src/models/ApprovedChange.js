import mongoose from 'mongoose';

const approvedChangeSchema = new mongoose.Schema(
  {
    law_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Law',
      required: true,
      index: true,
    },
    element_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Element',
      default: null,
    },
    winning_proposal_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LawChangeProposal',
      required: true,
    },
    change_type: {
      type: String,
      enum: ['edit', 'add', 'delete', 'move'],
      required: true,
    },
    element_type: {
      type: String,
      enum: ['article', 'clause', 'point', 'subpoint'],
      default: null,
    },
    new_text: { type: String, default: null },
    move_after_element_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Element',
      default: null,
    },
    votes_for_weighted: { type: Number, default: 0 },
    votes_against_weighted: { type: Number, default: 0 },
    iteration: { type: Number, default: 0 },
    supersedes_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApprovedChange',
      default: null,
    },
    is_current: { type: Boolean, default: true, index: true },
    status: {
      type: String,
      enum: ['active', 'archived', 'rolled_back'],
      default: 'active',
    },
    archived_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    archived_at: { type: Date, default: null },
    sort_order: { type: Number, default: 0 },
    parent_element_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Element',
      default: null,
    },
    approved_at: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

approvedChangeSchema.index({ law_id: 1, is_current: 1 });
approvedChangeSchema.index({ element_id: 1, is_current: 1 });

const ApprovedChange = mongoose.model('ApprovedChange', approvedChangeSchema);
export default ApprovedChange;
