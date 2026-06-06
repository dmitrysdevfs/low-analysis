import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  queryChatAssistant,
  getAssistantApiGuardStatus,
} from '../modules/assistant/assistant.llm.js';
import * as apiGuard from '../modules/assistant/assistant.api-guard.model.js';

// Mock the API guard module
vi.mock('../modules/assistant/assistant.api-guard.model.js', () => ({
  checkAndIncrementApiGuard: vi.fn(),
  getApiGuardStatus: vi.fn(),
}));

// Mock the google genai SDK
const mockGenerateContentStream = vi.fn();
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(function () {
      return {
        models: {
          generateContentStream: mockGenerateContentStream,
        },
      };
    }),
  };
});

describe('Assistant LLM client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should get guard status successfully', async () => {
    apiGuard.getApiGuardStatus.mockResolvedValue({
      used: 50,
      limit: 250,
      resetAt: new Date(),
    });

    const status = await getAssistantApiGuardStatus();
    expect(apiGuard.getApiGuardStatus).toHaveBeenCalledWith(250);
    expect(status.used).toBe(50);
  });

  it('should throw error if GEMINI_ASSISTANT_API_KEY is not set', async () => {
    delete process.env.GEMINI_ASSISTANT_API_KEY;
    apiGuard.checkAndIncrementApiGuard.mockResolvedValue({
      allowed: true,
      used: 1,
      limit: 250,
      resetAt: new Date(),
    });

    await expect(
      queryChatAssistant('System', [], 'Hello'),
    ).rejects.toThrow('GEMINI_ASSISTANT_API_KEY is not set');
  });

  it('should throw ASSISTANT_DAILY_LIMIT_REACHED if guard denies query', async () => {
    process.env.GEMINI_ASSISTANT_API_KEY = 'mock-key';
    const resetTime = new Date();
    
    apiGuard.checkAndIncrementApiGuard.mockResolvedValue({
      allowed: false,
      used: 251,
      limit: 250,
      resetAt: resetTime,
    });

    try {
      await queryChatAssistant('System', [], 'Hello');
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).toBe('ASSISTANT_DAILY_LIMIT_REACHED');
      expect(err.used).toBe(251);
      expect(err.limit).toBe(250);
      expect(err.resetAt).toBe(resetTime);
    }
  });

  it('should call generateContentStream when key is set and limit is not exceeded', async () => {
    process.env.GEMINI_ASSISTANT_API_KEY = 'mock-key';
    apiGuard.checkAndIncrementApiGuard.mockResolvedValue({
      allowed: true,
      used: 5,
      limit: 250,
      resetAt: new Date(),
    });

    const mockStream = { dummy: 'stream' };
    mockGenerateContentStream.mockResolvedValue(mockStream);

    const res = await queryChatAssistant(
      'System prompt instructions',
      [{ role: 'user', content: 'Prev message' }],
      'Current message',
      { temperature: 0.8, maxOutputTokens: 100, model: 'gemini-test-model' }
    );

    expect(apiGuard.checkAndIncrementApiGuard).toHaveBeenCalledWith(250);
    expect(mockGenerateContentStream).toHaveBeenCalledWith({
      model: 'gemini-test-model',
      contents: [
        { role: 'user', parts: [{ text: 'Prev message' }] },
        { role: 'user', parts: [{ text: 'Current message' }] },
      ],
      config: {
        systemInstruction: 'System prompt instructions',
        temperature: 0.8,
        maxOutputTokens: 100,
      },
    });
    expect(res).toBe(mockStream);
  });
});
