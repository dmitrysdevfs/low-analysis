import mongoose from 'mongoose';

const proposalSchema = new mongoose.Schema(
  {
    law_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Law',
      required: true,
      index: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'review', 'approved', 'rejected'],
      default: 'draft',
    },
    amendments_count: { type: Number, default: 0 },
    votes_summary: {
      positive: { type: Number, default: 0 },
      neutral: { type: Number, default: 0 },
      negative: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

const Proposal = mongoose.model('Proposal', proposalSchema);
export default Proposal;
