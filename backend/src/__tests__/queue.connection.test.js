import { describe, it, expect, afterEach } from 'vitest';

import { getRedisConnection } from '../modules/queue/queue.connection.js';

describe('getRedisConnection', () => {
  const original = process.env.REDIS_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = original;
    }
  });

  it('returns the URL from REDIS_URL with maxRetriesPerRequest: null', () => {
    process.env.REDIS_URL = 'redis://example:6380';

    expect(getRedisConnection()).toEqual({
      url: 'redis://example:6380',
      maxRetriesPerRequest: null,
    });
  });

  it('throws when REDIS_URL is not set', () => {
    delete process.env.REDIS_URL;

    expect(() => getRedisConnection()).toThrow(/REDIS_URL/);
  });
});
