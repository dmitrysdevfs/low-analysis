import mongoose from 'mongoose';

const sourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    href: { type: String, default: null },
    type: { type: String, enum: ['faq', 'article', 'law', 'help'], default: 'faq' },
  },
  { _id: false },
);

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    feedback: { type: Number, default: null },
    sources: { type: [sourceSchema], default: [] },
  },
  { timestamps: true },
);

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: String, index: true, default: null },
    guestIp: { type: String, default: null },
    title: { type: String, default: 'Нова сесія' },
    messages: { type: [messageSchema], default: [] },
    mode: {
      type: String,
      enum: ['general', 'law', 'article'],
      default: 'general',
    },
    contextLawId: { type: String, default: null },
    contextArticleNum: { type: String, default: null },
  },
  { timestamps: true },
);

export default mongoose.model('AssistantSession', sessionSchema, 'assistantsessions');
