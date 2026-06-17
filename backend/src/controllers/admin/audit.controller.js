import * as auditService from '../../services/admin/audit.service.js';

export const getAuditLog = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = parseInt(req.query.skip) || 0;
    const targetEmail = req.query.targetEmail || null;
    const targetUserId = req.query.targetUserId || null;
    const entries = await auditService.getAuditLog({
      limit,
      skip,
      targetEmail,
      targetUserId,
    });
    res.json(entries);
  } catch (err) {
    next(err);
  }
};

export const appendAuditEntry = async (req, res, next) => {
  try {
    const { action, detail, actor, severity } = req.body;
    if (!action || !actor)
      return res.status(400).json({ message: 'action and actor are required' });
    const entry = await auditService.appendAuditEntry({
      action,
      detail,
      actor,
      severity,
    });
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
};
