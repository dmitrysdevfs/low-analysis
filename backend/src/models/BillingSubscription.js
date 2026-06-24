import mongoose from 'mongoose';

const billingSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    planId: {
      type: String,
      enum: ['trial', 'user', 'plus', 'pro'],
      required: true,
    },
    status: {
      type: String,
      enum: ['inactive', 'trialing', 'active', 'expired', 'canceled'],
      default: 'inactive',
    },
    usageSearch: {
      type: Number,
      default: 0,
      min: 0,
    },
    usageView: {
      type: Number,
      default: 0,
      min: 0,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endsAt: {
      type: Date,
      default: null,
    },
    lastPaymentMethod: {
      type: String,
      default: null,
    },
    lastPaymentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

billingSubscriptionSchema.index({ userId: 1 }, { unique: true });

const BillingSubscription = mongoose.model(
  'BillingSubscription',
  billingSubscriptionSchema,
);

export default BillingSubscription;
