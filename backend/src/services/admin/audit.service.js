import AuditLog from '../../models/AuditLog.js';

export const appendAuditEntry = async ({
  action,
  detail,
  actor,
  severity = 'info',
}) => {
  return await AuditLog.create({ action, detail, actor, severity });
};

export const getAuditLog = async ({ limit = 50, skip = 0 } = {}) => {
  return await AuditLog.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const getAuditCount = async () => AuditLog.countDocuments();
