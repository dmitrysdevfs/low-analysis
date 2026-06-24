import mongoose from 'mongoose';
import { SUPPORT_STATUSES, SUPPORT_SENDER_TYPES } from './support.constants.js';

const supportConversationSchema = new mongoose.Schema(
  {
    participantType: {
      type: String,
      enum: ['user', 'guest'],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    guestVisitorId: {
      type: String,
      default: null,
      trim: true,
    },
    guestName: {
      type: String,
      default: '',
      trim: true,
    },
    guestEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: SUPPORT_STATUSES,
      default: 'open',
    },
    subject: {
      type: String,
      default: 'Support chat',
      trim: true,
    },
    startedFromPathname: {
      type: String,
      default: '/',
      trim: true,
    },
    startedFromPageTitle: {
      type: String,
      default: '',
      trim: true,
    },
    contextLawId: {
      type: String,
      default: null,
      trim: true,
    },
    contextArticleNum: {
      type: String,
      default: null,
      trim: true,
    },
    assignedAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    unreadForAdmin: {
      type: Number,
      default: 0,
      min: 0,
    },
    unreadForUser: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    lastMessageSnippet: {
      type: String,
      default: '',
      trim: true,
    },
    lastSenderType: {
      type: String,
      enum: SUPPORT_SENDER_TYPES,
      default: 'system',
    },
    telegramChatId: {
      type: String,
      default: null,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['normal', 'high', 'urgent'],
      default: 'normal',
    },
    spamFlag: {
      type: Boolean,
      default: false,
    },
    escalatedAt: {
      type: Date,
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

supportConversationSchema.index({ userId: 1, status: 1, updatedAt: -1 });
supportConversationSchema.index({
  guestVisitorId: 1,
  status: 1,
  updatedAt: -1,
});
supportConversationSchema.index({ status: 1, lastMessageAt: -1 });

export default mongoose.models.SupportConversation ||
  mongoose.model('SupportConversation', supportConversationSchema);
