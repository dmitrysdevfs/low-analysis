export const SUPPORT_VISITOR_COOKIE = 'la_support_visitor';
export const SUPPORT_VISITOR_COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 90;

export const SUPPORT_STATUSES = [
  'open',
  'waiting_support',
  'waiting_user',
  'closed',
];

export const SUPPORT_SENDER_TYPES = [
  'user',
  'admin',
  'telegram_support',
  'system',
];

export const SUPPORT_CHANNELS = ['web', 'telegram', 'system'];

export const SUPPORT_ENABLED =
  String(process.env.SUPPORT_CHAT_ENABLED ?? 'true').toLowerCase() !== 'false';
