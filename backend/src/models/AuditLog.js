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
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    targetEmail: { type: String, default: null },
    ipAddress: { type: String, default: null },
  },
  { timestamps: true },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ targetUserId: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
