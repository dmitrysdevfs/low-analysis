import mongoose from 'mongoose';

const lawChangeSchema = new mongoose.Schema(
  {
    forkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LawFork',
      required: true,
      index: true,
    },
    elementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Element',
      required: true,
    },
    elementCode: { type: String, required: true },
    operation: {
      type: String,
      enum: ['edit', 'add', 'delete'],
      required: true,
    },
    originalText: { type: String, default: '' },
    proposedText: { type: String, default: '' },
    rationale: { type: String, default: '' },
  },
  { timestamps: true },
);

lawChangeSchema.index({ forkId: 1 });
lawChangeSchema.index({ forkId: 1, elementId: 1 });
const LawChange = mongoose.model('LawChange', lawChangeSchema);
export default LawChange;
