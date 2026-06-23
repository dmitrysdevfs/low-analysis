import mongoose from 'mongoose';

const groupChatMessageSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderName: { type: String, required: true },
    text: { type: String, required: true, maxlength: 4000 },
    type: { type: String, enum: ['text', 'system'], default: 'text' },
  },
  { timestamps: true },
);

groupChatMessageSchema.index({ groupId: 1, createdAt: -1 });

const GroupChatMessage = mongoose.model('GroupChatMessage', groupChatMessageSchema);
export default GroupChatMessage;
