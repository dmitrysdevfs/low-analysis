import { randomUUID } from 'crypto';
import {
  SUPPORT_VISITOR_COOKIE,
  SUPPORT_VISITOR_COOKIE_MAX_AGE,
} from './support.constants.js';

export function readSupportVisitorId(req) {
  return req.cookies?.[SUPPORT_VISITOR_COOKIE] ?? null;
}

export function ensureSupportVisitorId(req, res) {
  const existing = readSupportVisitorId(req);
  if (existing) {
    return existing;
  }

  const visitorId = randomUUID();
  res.cookie(SUPPORT_VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SUPPORT_VISITOR_COOKIE_MAX_AGE,
  });
  return visitorId;
}
