import mongoose from 'mongoose';

const legislatorAccessRequestSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organization: { type: String, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    review_note: { type: String, default: '' },
  },
  { timestamps: true },
);

const LegislatorAccessRequest = mongoose.model(
  'LegislatorAccessRequest',
  legislatorAccessRequestSchema,
);
export default LegislatorAccessRequest;
