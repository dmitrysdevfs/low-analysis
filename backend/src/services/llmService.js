import { GoogleGenAI } from '@google/genai';
import { LLM_CONFIG } from '../config/llm.js';

const RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 1000;

let genaiClient = null;

/**
 * Returns a lazily-initialized Gemini client.
 */
const getClient = () => {
  if (!genaiClient) {
    if (!LLM_CONFIG.apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables.');
    }
    genaiClient = new GoogleGenAI({ apiKey: LLM_CONFIG.apiKey });
  }
  return genaiClient;
};

/**
 * Pauses execution for a given number of milliseconds.
 * @param {number} ms
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends a prompt to the LLM and returns a parsed JSON response.
 * Implements exponential backoff retry for transient errors.
 *
 * @param {string} systemPrompt - The system instruction for the model.
 * @param {string} userPrompt   - The user message (actual content to analyze).
 * @returns {Promise<Array|object>} Parsed JSON from the LLM response.
 * @throws {Error} If all retry attempts fail or the response is not valid JSON.
 */
/**
 * Sends a multi-turn chat to the LLM and returns a streaming async iterable.
 * Does NOT use responseMimeType: 'application/json' — intended for conversational chat.
 *
 * @param {string} systemPrompt
 * @param {{ role: string, content: string }[]} history - prior messages
 * @param {string} userMessage - current user message
 * @param {{ stream?: boolean, temperature?: number, maxOutputTokens?: number }} options
 * @returns {Promise<AsyncIterable>} stream of GenerateContentResponse chunks
 */
export const queryChatLLM = async (systemPrompt, history, userMessage, options = {}) => {
  const client = getClient();
  const { temperature = 0.4, maxOutputTokens = 2048 } = options;

  const contents = [
    ...history.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  const stream = await client.models.generateContentStream({
    model: options.model || (process.env.LLM_MODEL || 'gemini-2.5-flash'),
    contents,
    config: {
      systemInstruction: systemPrompt,
      temperature,
      maxOutputTokens,
    },
  });

  return stream;
};

export const queryLLM = async (systemPrompt, userPrompt) => {
  const client = getClient();
  let lastError;

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      const response = await client.models.generateContent({
        model: LLM_CONFIG.model,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: Math.min(
            1.0,
            LLM_CONFIG.temperature + (attempt - 1) * 0.2,
          ), // Increase temp on retries (e.g., 0.1, 0.3, 0.5)
          maxOutputTokens: LLM_CONFIG.maxOutputTokens,
          responseMimeType: 'application/json',
        },
      });

      // In @google/genai v1, response.text is a string property, not a method
      const rawText = response.text;

      // Strip markdown code fences if the model wraps its output
      const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      try {
        return JSON.parse(cleaned);
      } catch (parseError) {
        console.error('[llmService] JSON Parse Error. Raw response was:');
        console.error(rawText);
        console.error('[llmService] Cleaned response was:');
        console.error(cleaned);
        const finishReason =
          response.candidates?.[0]?.finishReason || 'UNKNOWN';
        console.error(`[llmService] Finish Reason: ${finishReason}`);
        throw parseError;
      }
    } catch (error) {
      lastError = error;

      const isRetryable =
        error instanceof SyntaxError ||
        error.message?.includes('JSON') ||
        error.message?.includes('429') ||
        error.message?.includes('503') ||
        error.message?.includes('UNAVAILABLE');

      if (isRetryable && attempt < RETRY_ATTEMPTS) {
        const delay = RETRY_DELAY_MS * 2 ** (attempt - 1);
        console.warn(
          `[llmService] Attempt ${attempt} failed (${error.message}). Retrying in ${delay}ms...`,
        );
        await sleep(delay);
      } else {
        break;
      }
    }
  }

  throw new Error(
    `[llmService] All ${RETRY_ATTEMPTS} attempts failed. Last error: ${lastError?.message}`,
  );
};
