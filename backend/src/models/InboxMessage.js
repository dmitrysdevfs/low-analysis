import mongoose from 'mongoose';

const inboxMessageSchema = new mongoose.Schema(
  {
    connectionKey: {
      type: String,
      required: true,
      default: 'shared-gmail-inbox',
      index: true,
    },
    gmailMessageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    gmailThreadId: {
      type: String,
      required: true,
      index: true,
    },
    from: {
      type: String,
      default: '',
    },
    to: {
      type: [String],
      default: [],
    },
    cc: {
      type: [String],
      default: [],
    },
    subject: {
      type: String,
      default: '(Без теми)',
    },
    snippet: {
      type: String,
      default: '',
    },
    plainTextBody: {
      type: String,
      default: '',
    },
    htmlBody: {
      type: String,
      default: '',
    },
    labels: {
      type: [String],
      default: [],
    },
    internalDate: {
      type: Date,
      default: null,
      index: true,
    },
    isInbound: {
      type: Boolean,
      default: true,
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

inboxMessageSchema.index({
  connectionKey: 1,
  gmailThreadId: 1,
  internalDate: 1,
});

export default mongoose.model('InboxMessage', inboxMessageSchema);
