/**
 * LLM provider configuration.
 * Provider is selected via LLM_PROVIDER env variable.
 * Currently supported: 'gemini' (default).
 */
export const LLM_CONFIG = {
  provider: process.env.LLM_PROVIDER || 'gemini',
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.LLM_MODEL || 'gemini-2.5-flash',
  maxOutputTokens: 4096,
  temperature: 0.1, // Low temperature for deterministic structured output
};
