import { AI_LIMITS } from './assistant.constants.js';

// In-memory store: key → { count, resetAt }
const store = new Map();

// Clean up expired entries every 30 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) store.delete(key);
    }
  },
  30 * 60 * 1000,
);

function getDayResetMs() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

function getMonthResetMs() {
  const next = new Date();
  next.setMonth(next.getMonth() + 1, 1);
  next.setHours(0, 0, 0, 0);
  return next.getTime();
}

function resolveLimit(userRole, planId) {
  if (userRole === 'admin')
    return { limit: AI_LIMITS.admin, resetAt: getMonthResetMs() };
  if (!userRole) return { limit: AI_LIMITS.guest, resetAt: getDayResetMs() };

  const planKey = planId || 'user';
  const limit = AI_LIMITS[planKey] ?? AI_LIMITS.user;
  return { limit, resetAt: getDayResetMs() };
}

/**
 * Check if the user/IP has quota remaining, then consume one unit.
 * @param {string|null} userId
 * @param {string} ipAddress
 * @param {string|null} userRole
 * @param {string|null} planId
 */
export function consumeAiQuota(userId, ipAddress, userRole, planId) {
  const { limit, resetAt } = resolveLimit(userRole, planId);

  if (limit === null) return { allowed: true, used: null, limit: null };

  const key = userId ? `uid:${userId}` : `ip:${ipAddress}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt });
    return { allowed: true, used: 1, limit };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      used: entry.count,
      limit,
      reason: 'quota_exceeded',
      resetAt: entry.resetAt,
    };
  }

  entry.count += 1;
  return { allowed: true, used: entry.count, limit };
}

/**
 * Peek at current quota without consuming.
 */
export function peekAiQuota(userId, ipAddress, userRole, planId) {
  const { limit, resetAt } = resolveLimit(userRole, planId);
  if (limit === null) return { allowed: true, used: null, limit: null };

  const key = userId ? `uid:${userId}` : `ip:${ipAddress}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now)
    return { allowed: true, used: 0, limit, resetAt };

  return {
    allowed: entry.count < limit,
    used: entry.count,
    limit,
    resetAt,
  };
}
