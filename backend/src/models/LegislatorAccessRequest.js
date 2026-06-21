import mongoose from 'mongoose';

const legislatorAccessRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestedRole: {
      type: String,
      enum: ['legislator', 'supervisor'],
      default: 'legislator',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    organization: { type: String, default: '', trim: true },
    reason: { type: String, default: '', trim: true },
    adminNote: { type: String, default: '' },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

legislatorAccessRequestSchema.index({ userId: 1, status: 1 });
const LegislatorAccessRequest = mongoose.model(
  'LegislatorAccessRequest',
  legislatorAccessRequestSchema,
);
export default LegislatorAccessRequest;
