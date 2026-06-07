import mongoose from 'mongoose';
import {
  SUPPORT_CHANNELS,
  SUPPORT_SENDER_TYPES,
} from './support.constants.js';

const supportMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupportConversation',
      required: true,
      index: true,
    },
    senderType: {
      type: String,
      enum: SUPPORT_SENDER_TYPES,
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    senderName: {
      type: String,
      default: '',
      trim: true,
    },
    senderEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    channel: {
      type: String,
      enum: SUPPORT_CHANNELS,
      default: 'web',
    },
    deliveredToTelegram: {
      type: Boolean,
      default: false,
    },
    telegramMessageId: {
      type: Number,
      default: null,
    },
    telegramChatId: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

supportMessageSchema.index({ conversationId: 1, createdAt: 1 });
supportMessageSchema.index({ telegramMessageId: 1 }, { sparse: true });

export default mongoose.models.SupportMessage ||
  mongoose.model('SupportMessage', supportMessageSchema);
