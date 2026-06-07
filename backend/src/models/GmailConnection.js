import mongoose from 'mongoose';

const gmailConnectionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'shared-gmail-inbox',
      index: true,
    },
    provider: {
      type: String,
      required: true,
      default: 'gmail',
    },
    mailboxEmail: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['disconnected', 'connected', 'error'],
      default: 'disconnected',
    },
    accessToken: {
      type: String,
      default: null,
      select: false,
    },
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
    tokenExpiryDate: {
      type: Date,
      default: null,
    },
    scopes: {
      type: [String],
      default: [],
    },
    connectedAt: {
      type: Date,
      default: null,
    },
    connectedBy: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    lastSyncAt: {
      type: Date,
      default: null,
    },
    lastHistoryId: {
      type: String,
      default: null,
    },
    lastError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model('GmailConnection', gmailConnectionSchema);
