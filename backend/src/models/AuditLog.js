import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    detail: { type: String, default: '' },
    actor: { type: String, required: true },
    severity: {
      type: String,
      enum: ['info', 'warning', 'security'],
      default: 'info',
    },
  },
  { timestamps: true },
);

auditLogSchema.index({ createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
