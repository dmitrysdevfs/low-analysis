import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['page_view', 'search', 'law_view'],
      required: true,
    },
    path: { type: String, default: null },
    query: { type: String, default: null },
    lawId: { type: String, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: true },
);

userActivitySchema.index({ userId: 1, createdAt: -1 });
userActivitySchema.index({ userId: 1, type: 1, createdAt: -1 });

const UserActivity = mongoose.model('UserActivity', userActivitySchema);
export default UserActivity;
