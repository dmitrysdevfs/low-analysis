import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    proposal_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RadiantProposal',
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vote: { type: String, enum: ['for', 'against'], required: true },
    vote_weight: { type: Number, required: true },
  },
  { timestamps: true },
);

schema.index({ proposal_id: 1, user_id: 1 }, { unique: true });

export default mongoose.model('RadiantProposalVote', schema);
