import { GoogleGenAI, Type } from '@google/genai';
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
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                canonical_name: {
                  type: Type.STRING,
                  description: "Головна офіційна назва суб'єкта.",
                },
                aliases: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Список альтернативних назв або займенників.',
                },
                legal_status: {
                  type: Type.STRING,
                  description:
                    'Юридичний статус: executive_body, official, legal_entity, individual, self_regulatory_org, other.',
                },
                role: {
                  type: Type.STRING,
                  description:
                    'Роль: actor, target_of_control, recipient, regulator, protected_party, other.',
                },
                description: {
                  type: Type.STRING,
                  description:
                    "Коротке визначення суб'єкта на основі GLOBAL_CONTEXT (до 1-2 речень). Якщо визначення відсутнє, повертай null.",
                  nullable: true,
                },
                confidence: {
                  type: Type.STRING,
                  description: 'Впевненість: high, medium, low.',
                },
              },
              required: [
                'canonical_name',
                'aliases',
                'legal_status',
                'role',
                'description',
                'confidence',
              ],
            },
          },
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
