import { GoogleGenAI } from '@google/genai';
import {
  checkAndIncrementApiGuard,
  getApiGuardStatus,
} from './assistant.api-guard.model.js';

// ── Isolated Gemini client for the frontend assistant only ────────────────────
// Reads GEMINI_ASSISTANT_API_KEY exclusively.
// Never imports from ../../config/llm.js (that key is for batch subject analysis).

const DAILY_LIMIT = 250;

let assistantClient = null;

function getAssistantClient() {
  if (!assistantClient) {
    const key = process.env.GEMINI_ASSISTANT_API_KEY;
    if (!key) throw new Error('GEMINI_ASSISTANT_API_KEY is not set');
    assistantClient = new GoogleGenAI({ apiKey: key });
  }
  return assistantClient;
}

/**
 * Returns the current global API guard status (no side effects).
 * Used by GET /api/assistant/quota to expose globalUsed/globalLimit.
 */
export async function getAssistantApiGuardStatus() {
  return getApiGuardStatus(DAILY_LIMIT);
}

// ── Streaming chat function ────────────────────────────────────────────────────

/**
 * Streams a chat response using the assistant-specific Gemini client.
 * Atomically checks and increments the global daily counter in MongoDB
 * before each call — safe across restarts and multiple instances.
 *
 * @param {string} systemPrompt
 * @param {{ role: string, content: string }[]} history
 * @param {string} userMessage
 * @param {{ temperature?: number, maxOutputTokens?: number, model?: string }} options
 * @returns {Promise<AsyncIterable>}
 */
export async function queryChatAssistant(
  systemPrompt,
  history,
  userMessage,
  options = {},
) {
  const guard = await checkAndIncrementApiGuard(DAILY_LIMIT);

  if (!guard.allowed) {
    const err = new Error('ASSISTANT_DAILY_LIMIT_REACHED');
    err.resetAt = guard.resetAt;
    err.used = guard.used;
    err.limit = guard.limit;
    throw err;
  }

  const client = getAssistantClient();
  const { temperature = 0.4, maxOutputTokens = 2048 } = options;

  const contents = [
    ...history.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  const stream = await client.models.generateContentStream({
    model: options.model || process.env.LLM_MODEL || 'gemini-2.5-flash',
    contents,
    config: {
      systemInstruction: systemPrompt,
      temperature,
      maxOutputTokens,
    },
  });

  return stream;
}
