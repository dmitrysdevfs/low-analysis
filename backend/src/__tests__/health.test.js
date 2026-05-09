import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /', () => {
  it('returns 200 with message and version', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Low Analysis API is running');
    expect(res.body.version).toBe('0.1.0');
  });
});
