import mongoose from 'mongoose';

const lawForkSchema = new mongoose.Schema(
  {
    lawId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Law',
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['draft', 'review', 'approved', 'rejected'],
      default: 'draft',
      index: true,
    },
    submittedAt: { type: Date, default: null },
    reviewNote: { type: String, default: '' },
  },
  { timestamps: true },
);

lawForkSchema.index({ lawId: 1, authorId: 1 });
const LawFork = mongoose.model('LawFork', lawForkSchema);
export default LawFork;
