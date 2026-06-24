import mongoose from 'mongoose';

const supportNoteSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupportConversation',
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: { type: String, default: '' },
    authorEmail: { type: String, default: '' },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

supportNoteSchema.index({ conversationId: 1, createdAt: -1 });

export default mongoose.models.SupportNote ||
  mongoose.model('SupportNote', supportNoteSchema);
