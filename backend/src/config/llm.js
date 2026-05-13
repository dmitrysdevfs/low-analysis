/**
 * LLM provider configuration.
 * Uses lazy getters so that process.env is read at call-time, not at module
 * load time. This avoids ESM initialization order issues where this module
 * is evaluated before dotenv.config() runs in server.js.
 */
export const LLM_CONFIG = {
  get provider() {
    return process.env.LLM_PROVIDER || 'gemini';
  },
  get apiKey() {
    return process.env.GEMINI_API_KEY;
  },
  get model() {
    return process.env.LLM_MODEL || 'gemini-2.5-flash';
  },
  maxOutputTokens: 4096,
  temperature: 0.1, // Low temperature for deterministic structured output
};
