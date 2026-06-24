import mongoose from 'mongoose';

const groupChatReadStateSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastReadAt: { type: Date, default: () => new Date(0) },
  },
  { timestamps: true },
);

groupChatReadStateSchema.index({ groupId: 1, userId: 1 }, { unique: true });

const GroupChatReadState = mongoose.model(
  'GroupChatReadState',
  groupChatReadStateSchema,
);
export default GroupChatReadState;
