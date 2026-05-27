export const CHAT_LLM_CONFIG = {
  get model() {
    return process.env.LLM_MODEL || 'gemini-2.5-flash';
  },
  temperature: 0.4,
  maxOutputTokens: 2048,
  maxRetries: 2,
};

export function getAssistantMode() {
  return process.env.ASSISTANT_MODE || 'stub';
}

export function isAssistantEnabled() {
  return process.env.ASSISTANT_ENABLED !== 'false';
}
