import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema(
  {
    amendment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Amendment',
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    value: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      required: true,
    },
  },
  { timestamps: true },
);

voteSchema.index({ amendment_id: 1, user_id: 1 }, { unique: true });

const Vote = mongoose.model('Vote', voteSchema);
export default Vote;
