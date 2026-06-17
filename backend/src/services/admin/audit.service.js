import AuditLog from '../../models/AuditLog.js';

export const appendAuditEntry = async ({
  action,
  detail,
  actor,
  severity = 'info',
  targetUserId = null,
  targetEmail = null,
  ipAddress = null,
}) => {
  return await AuditLog.create({
    action,
    detail,
    actor,
    severity,
    targetUserId,
    targetEmail,
    ipAddress,
  });
};

export const getAuditLog = async ({
  limit = 50,
  skip = 0,
  targetEmail,
  targetUserId,
} = {}) => {
  const filter = {};
  if (targetUserId) {
    filter.targetUserId = targetUserId;
  } else if (targetEmail) {
    filter.$or = [
      { targetEmail: { $regex: targetEmail, $options: 'i' } },
      { detail: { $regex: targetEmail, $options: 'i' } },
    ];
  }
  return await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const getAuditCount = async () => AuditLog.countDocuments();
