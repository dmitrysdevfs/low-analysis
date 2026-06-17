import mongoose from 'mongoose';

const legislatorAccessRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    message: { type: String, default: '', trim: true },
    adminNote: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

legislatorAccessRequestSchema.index({ userId: 1, status: 1 });
const LegislatorAccessRequest = mongoose.model('LegislatorAccessRequest', legislatorAccessRequestSchema);
export default LegislatorAccessRequest;
