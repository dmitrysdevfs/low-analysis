import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailCampaign' },
  recipientEmail: { type: String, required: true },
  recipientName: String,
  status: { type: String, enum: ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'], default: 'sent' },
  brevoMessageId: String,
  error: String,
  openedAt: Date,
  clickedAt: Date,
}, { timestamps: true });

export default mongoose.model('EmailLog', emailLogSchema);
