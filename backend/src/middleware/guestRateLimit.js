/**
 * Server-side rate limiting for unauthenticated (guest) requests.
 * Uses in-memory sliding window — resets on server restart.
 * Authenticated requests (cookie or Bearer token) are exempt.
 *
 * Limits (per IP):
 *   - 60 requests per 10-minute window
 *   - 2-minute cooldown after limit is hit
 */

import { getClientIp as _getClientIp } from '../utils/getClientIp.js';

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 60;
const COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes after limit

// Map<ip, { timestamps: number[], cooldownUntil: number }>
const store = new Map();

const getClientIp = (req) => _getClientIp(req) ?? 'unknown';

function prune(timestamps, now) {
  const cutoff = now - WINDOW_MS;
  return timestamps.filter((t) => t > cutoff);
}

export function guestRateLimit(req, res, next) {
  // Skip for authenticated users (cookie handled by cookie-parser, token via header)
  if (req.cookies?.token || req.headers.authorization?.startsWith('Bearer')) {
    return next();
  }

  const ip = getClientIp(req);
  const now = Date.now();

  let entry = store.get(ip);
  if (!entry) {
    entry = { timestamps: [], cooldownUntil: 0 };
    store.set(ip, entry);
  }

  // Cooldown active
  if (now < entry.cooldownUntil) {
    const retryAfter = Math.ceil((entry.cooldownUntil - now) / 1000);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({
      message: 'Забагато запитів. Будь ласка, зачекайте кілька хвилин.',
      retryAfterSeconds: retryAfter,
    });
  }

  // Prune old timestamps and check limit
  entry.timestamps = prune(entry.timestamps, now);

  if (entry.timestamps.length >= MAX_REQUESTS) {
    entry.cooldownUntil = now + COOLDOWN_MS;
    store.set(ip, entry);
    res.set('Retry-After', String(COOLDOWN_MS / 1000));
    return res.status(429).json({
      message: 'Забагато запитів. Будь ласка, зачекайте кілька хвилин.',
      retryAfterSeconds: COOLDOWN_MS / 1000,
    });
  }

  entry.timestamps.push(now);
  store.set(ip, entry);
  return next();
}

// Periodically clear old entries to prevent memory growth (every 30 min)
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, entry] of store.entries()) {
      const recent = prune(entry.timestamps, now);
      if (recent.length === 0 && now >= entry.cooldownUntil) {
        store.delete(ip);
      }
    }
  },
  30 * 60 * 1000,
);
