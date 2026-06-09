export const ASSISTANT_MODE = {
  STUB: 'stub',
  LLM: 'llm',
};

// Per-period request limits. null = unlimited.
// Guest = per day by IP. User/plan = per day. Admin = per calendar month.
export const AI_LIMITS = {
  guest: 5,
  user: 50,
  plus: 200,
  pro: null,
  trial: 30,
  admin: 500,
};

export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_HISTORY_MESSAGES = 20;

export const SSE_EVENTS = {
  TOKEN: 'token',
  DONE: 'done',
  ERROR: 'error',
  LIMIT: 'limit',
};

export const ASSISTANT_MESSAGES = {
  GLOBAL_LIMIT: 'Глобальний денний ліміт AI-запитів вичерпано. Спробуйте пізніше.',
  REQUEST_ERROR: 'Помилка обробки запиту',
};
