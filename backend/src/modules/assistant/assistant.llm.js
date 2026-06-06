import { GoogleGenAI } from '@google/genai';

// ── Isolated Gemini client for the frontend assistant only ────────────────────
// Reads GEMINI_ASSISTANT_API_KEY exclusively.
// Never imports from ../../config/llm.js (that key is for batch subject analysis).

let assistantClient = null;

function getAssistantClient() {
  if (!assistantClient) {
    const key = process.env.GEMINI_ASSISTANT_API_KEY;
    if (!key) throw new Error('GEMINI_ASSISTANT_API_KEY is not set');
    assistantClient = new GoogleGenAI({ apiKey: key });
  }
  return assistantClient;
}

// ── Global daily API guard (50% of free-tier 500 RPD = 250 req/day) ──────────

const DAILY_LIMIT = 250;

const guard = {
  count: 0,
  resetAt: nextMidnightUTC(),
};

function nextMidnightUTC() {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d;
}

function checkAndIncrementGuard() {
  const now = new Date();
  if (now >= guard.resetAt) {
    guard.count = 0;
    guard.resetAt = nextMidnightUTC();
  }
  if (guard.count >= DAILY_LIMIT) {
    const err = new Error('ASSISTANT_DAILY_LIMIT_REACHED');
    err.resetAt = guard.resetAt;
    err.used = guard.count;
    err.limit = DAILY_LIMIT;
    throw err;
  }
  guard.count++;
}

export function getAssistantApiGuardStatus() {
  const now = new Date();
  if (now >= guard.resetAt) {
    guard.count = 0;
    guard.resetAt = nextMidnightUTC();
  }
  return { used: guard.count, limit: DAILY_LIMIT, resetAt: guard.resetAt };
}

// ── Streaming chat function ────────────────────────────────────────────────────

/**
 * Streams a chat response using the assistant-specific Gemini client.
 * Checks the global daily guard before each call.
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
  checkAndIncrementGuard();

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
