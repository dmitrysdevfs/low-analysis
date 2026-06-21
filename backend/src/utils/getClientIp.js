/**
 * Extracts client IP from the request.
 * Relies on Express `trust proxy` being set so req.ip already reflects
 * the real client IP behind Render/Vercel reverse proxies.
 */
export function getClientIp(req) {
  return req.ip || req.socket?.remoteAddress || null;
}
