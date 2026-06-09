import mongoose from 'mongoose';

const billingTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    planId: {
      type: String,
      enum: ['trial', 'user', 'plus', 'pro'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    method: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'completed',
    },
    provider: {
      type: String,
      default: 'demo',
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actorEmail: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

billingTransactionSchema.index({ userId: 1, createdAt: -1 });

const BillingTransaction = mongoose.model(
  'BillingTransaction',
  billingTransactionSchema,
);

export default BillingTransaction;
