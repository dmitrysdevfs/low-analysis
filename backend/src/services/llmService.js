import { GoogleGenAI } from '@google/genai';
import { LLM_CONFIG } from '../config/llm.js';

const RETRY_ATTEMPTS = 3;
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
          temperature: LLM_CONFIG.temperature,
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

      return JSON.parse(cleaned);
    } catch (error) {
      lastError = error;

      const isRetryable =
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
