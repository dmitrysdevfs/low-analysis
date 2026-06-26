import mongoose from 'mongoose';
import User from '../../models/User.js';
import UserActivity from '../../models/UserActivity.js';
import AuditLog from '../../models/AuditLog.js';
import { appendAuditEntry } from './audit.service.js';

export const listUsers = async ({ q = '', page = 1, limit = 50 } = {}) => {
  const filter = q
    ? {
        $or: [
          { fullName: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
        ],
      }
    : {};
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);
  return { users, total, page, limit };
};

export const setUserStatus = async (id, status, actor) => {
  const user = await User.findByIdAndUpdate(
    id,
    { status },
    { new: true },
  ).select('-password');
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  await appendAuditEntry({
    action:
      status === 'inactive' ? 'Акаунт деактивовано' : 'Акаунт реактивовано',
    detail: `Акаунт ${user.email} переведено в статус ${status}.`,
    actor,
    severity: 'warning',
    targetUserId: user._id,
    targetEmail: user.email,
  });
  return user;
};

export const setUserRole = async (id, role, actor) => {
  const allowed = ['user', 'paid_user', 'legislator', 'supervisor', 'admin'];
  if (!allowed.includes(role))
    throw Object.assign(new Error('Invalid role'), { status: 400 });
  const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select(
    '-password',
  );
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  const actionLabel =
    role === 'admin'
      ? 'Акаунт підвищено до адміна'
      : role === 'supervisor'
        ? 'Призначено супервайзером'
        : role === 'legislator'
          ? 'Призначено законотворцем'
          : 'Роль змінено';
  await appendAuditEntry({
    action: actionLabel,
    detail: `Акаунт ${user.email} отримав роль ${role}.`,
    actor,
    severity: 'security',
    targetUserId: user._id,
    targetEmail: user.email,
  });
  return user;
};

export const setUserBilling = async (id, billingPlan, actor) => {
  const plans = ['preview', 'trial', 'user', 'plus', 'pro'];
  if (!plans.includes(billingPlan))
    throw Object.assign(new Error('Invalid plan'), { status: 400 });
  const user = await User.findByIdAndUpdate(
    id,
    { billingPlan },
    { new: true },
  ).select('-password');
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  await appendAuditEntry({
    action: 'План білінгу оновлено',
    detail: `План ${billingPlan} призначено для ${user.email}.`,
    actor,
    severity: 'security',
    targetUserId: user._id,
    targetEmail: user.email,
  });
  return user;
};

export const getUserById = async (id) => {
  const user = await User.findById(id).select('-password').lean();
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return user;
};

export const recordForceLogout = async (id, actor) => {
  const user = await User.findById(id).select('-password').lean();
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  await appendAuditEntry({
    action: 'Виконано примусовий вихід',
    detail: `Для акаунта ${user.email} застосовано примусовий вихід.`,
    actor,
    severity: 'warning',
    targetUserId: user._id,
    targetEmail: user.email,
  });
  return { ok: true };
};

export const getUserOverview = async (id) => {
  const objectId = new mongoose.Types.ObjectId(id);
  const user = await User.findById(id).select('-password').lean();
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const [activityEntries, auditEntries] = await Promise.all([
    UserActivity.find({ userId: objectId })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean(),
    AuditLog.find({
      $or: [
        { targetUserId: objectId },
        { detail: { $regex: user.email, $options: 'i' } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean(),
  ]);

  const stats = {
    pageViews: activityEntries.filter((e) => e.type === 'page_view').length,
    searches: activityEntries.filter((e) => e.type === 'search').length,
    lawViews: activityEntries.filter((e) => e.type === 'law_view').length,
    totalEvents: auditEntries.length,
  };

  const lastActivityAt =
    activityEntries[0]?.createdAt ?? auditEntries[0]?.createdAt ?? null;

  const verifiedResources = [];
  if (user.registrationSource?.referrer) {
    verifiedResources.push({
      url: user.registrationSource.referrer,
      source: user.registrationSource.source,
      verifiedAt: user.createdAt,
      status: 'active',
    });
  }

  return {
    user,
    stats,
    activity: activityEntries,
    auditEntries,
    verifiedResources,
    tracking: {
      enabled: true,
      logsActive: true,
      retentionDays: 180,
      lastUpdatedAt: lastActivityAt,
    },
  };
};
