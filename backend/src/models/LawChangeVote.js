import mongoose from 'mongoose';

const lawChangeVoteSchema = new mongoose.Schema(
  {
    proposal_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LawChangeProposal', required: true, index: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vote: { type: String, enum: ['for', 'against'], required: true },
    vote_weight: { type: Number, required: true, default: 1 }, // 1 for user, 3 for legislator
  },
  { timestamps: true },
);

// One vote per user per proposal
lawChangeVoteSchema.index({ proposal_id: 1, user_id: 1 }, { unique: true });

const LawChangeVote = mongoose.model('LawChangeVote', lawChangeVoteSchema);
export default LawChangeVote;
