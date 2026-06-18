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
  severity,
  actor,
  q,
  dateFrom,
  dateTo,
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

  if (severity) filter.severity = severity;
  if (actor) filter.actor = { $regex: actor, $options: 'i' };

  if (q) {
    const textConditions = [
      { action: { $regex: q, $options: 'i' } },
      { detail: { $regex: q, $options: 'i' } },
      { actor: { $regex: q, $options: 'i' } },
    ];
    filter.$or = filter.$or ? [...filter.$or, ...textConditions] : textConditions;
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  return await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const getAuditCount = async () => AuditLog.countDocuments();

export const getAuditOverview = async () => {
  const now = new Date();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

  const [
    total,
    infoCount,
    warningCount,
    securityCount,
    lastHourTotal,
    lastHourInfo,
    lastHourWarning,
    lastHourSecurity,
    failedLogins,
    roleChanges,
    newIpsRaw,
  ] = await Promise.all([
    AuditLog.countDocuments(),
    AuditLog.countDocuments({ severity: 'info' }),
    AuditLog.countDocuments({ severity: 'warning' }),
    AuditLog.countDocuments({ severity: 'security' }),
    AuditLog.countDocuments({ createdAt: { $gte: oneHourAgo } }),
    AuditLog.countDocuments({ severity: 'info', createdAt: { $gte: oneHourAgo } }),
    AuditLog.countDocuments({ severity: 'warning', createdAt: { $gte: oneHourAgo } }),
    AuditLog.countDocuments({ severity: 'security', createdAt: { $gte: oneHourAgo } }),
    AuditLog.countDocuments({
      createdAt: { $gte: oneDayAgo },
      $or: [
        { action: { $regex: 'невалідний', $options: 'i' } },
        { action: { $regex: 'невдал', $options: 'i' } },
      ],
    }),
    AuditLog.countDocuments({
      severity: 'security',
      createdAt: { $gte: oneDayAgo },
      $or: [
        { action: { $regex: 'роль', $options: 'i' } },
        { action: { $regex: 'підвищено', $options: 'i' } },
        { action: { $regex: 'знято', $options: 'i' } },
        { action: { $regex: 'адміністратор', $options: 'i' } },
      ],
    }),
    AuditLog.distinct('ipAddress', {
      createdAt: { $gte: oneDayAgo },
      ipAddress: { $ne: null },
    }),
  ]);

  const pct = (n, t) => (t > 0 ? Math.round((n / t) * 100) : 0);

  return {
    total,
    bySeverity: { info: infoCount, warning: warningCount, security: securityCount, critical: 0 },
    lastHourDelta: {
      total: lastHourTotal,
      info: lastHourInfo,
      warning: lastHourWarning,
      security: lastHourSecurity,
      critical: 0,
    },
    streamPercent: {
      info: pct(infoCount, total),
      warning: pct(warningCount, total),
      security: pct(securityCount, total),
      critical: 0,
    },
    securitySignals: {
      failedLogins,
      roleChanges,
      newIps: newIpsRaw.length,
    },
    lastSyncAt: now.toISOString(),
    retentionDays: 180,
    integrityPercent: 100,
  };
};
