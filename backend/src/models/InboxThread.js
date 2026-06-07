import mongoose from 'mongoose';

const inboxThreadSchema = new mongoose.Schema(
  {
    connectionKey: {
      type: String,
      required: true,
      default: 'shared-gmail-inbox',
      index: true,
    },
    gmailThreadId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    subject: {
      type: String,
      default: '(Без теми)',
    },
    snippet: {
      type: String,
      default: '',
    },
    participants: {
      type: [String],
      default: [],
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    labels: {
      type: [String],
      default: [],
    },
    lastMessageAt: {
      type: Date,
      default: null,
      index: true,
    },
    syncedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

inboxThreadSchema.index({ connectionKey: 1, lastMessageAt: -1 });

export default mongoose.model('InboxThread', inboxThreadSchema);
