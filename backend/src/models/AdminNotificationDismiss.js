import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    adminId: { type: String, required: true },
    sourceType: {
      type: String,
      enum: ['security', 'request', 'support', 'inbox'],
      required: true,
    },
    sourceId: { type: String, required: true },
    dismissedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

schema.index({ adminId: 1 });
schema.index({ adminId: 1, sourceId: 1 }, { unique: true });

export default mongoose.model(
  'AdminNotificationDismiss',
  schema,
  'adminnotificationdismisses',
);
