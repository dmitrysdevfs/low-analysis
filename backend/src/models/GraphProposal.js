import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    proposal_type: {
      type: String,
      enum: ['add_law', 'remove_law', 'add_edge', 'remove_edge'],
      required: true,
    },
    law_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Law', default: null },
    source_law_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Law',
      default: null,
    },
    target_law_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Law',
      default: null,
    },
    edge_type: { type: String, default: null },
    reason: { type: String, default: '' },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    author_display_name: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'active', 'approved', 'rejected', 'withdrawn', 'expired'],
      default: 'draft',
      index: true,
    },
    votes_for_weighted: { type: Number, default: 0 },
    votes_against_weighted: { type: Number, default: 0 },
    votes_for_count: { type: Number, default: 0 },
    votes_against_count: { type: Number, default: 0 },
    voting_deadline: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model('GraphProposal', schema);
