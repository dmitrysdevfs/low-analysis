import mongoose from 'mongoose';

const emailCampaignSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  previewText: String,
  templateSlug: { type: String, required: true }, // 'broadcast' | 'maintenance' | 'product-update'
  theme: { type: String, default: 'default' }, // 'default' | 'teal' | 'violet' | 'sun'
  body: { type: String, required: true }, // rendered HTML
  audience: {
    type: { type: String, enum: ['all', 'role', 'billing', 'custom'], default: 'all' },
    roles: [String],
    billingPlans: [String],
    customEmails: [String],
  },
  status: { type: String, enum: ['draft', 'sending', 'sent', 'failed'], default: 'draft' },
  sentAt: Date,
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipientCount: { type: Number, default: 0 },
  deliveredCount: { type: Number, default: 0 },
  openCount: { type: Number, default: 0 },
  clickCount: { type: Number, default: 0 },
  bounceCount: { type: Number, default: 0 },
  brevoMessageIds: [String],
}, { timestamps: true });

export default mongoose.model('EmailCampaign', emailCampaignSchema);
