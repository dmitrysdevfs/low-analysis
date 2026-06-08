import mongoose from 'mongoose';

const userFocusTopicSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    label: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

userFocusTopicSchema.index({ userId: 1, createdAt: -1 });

const UserFocusTopic = mongoose.model('UserFocusTopic', userFocusTopicSchema);
export default UserFocusTopic;
