import { MAX_MESSAGE_LENGTH } from './assistant.constants.js';

// Strip HTML tags and dangerous control characters
function sanitizeMessage(text) {
  return text
    .replace(/<[^>]*>/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
}

export function validateChatRequest(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { message, sessionId } = body;

  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'message is required' };
  }

  const cleaned = sanitizeMessage(message);
  if (!cleaned) {
    return { valid: false, error: 'message is empty after sanitization' };
  }

  return {
    valid: true,
    message: cleaned,
    sessionId: typeof sessionId === 'string' ? sessionId : null,
  };
}
