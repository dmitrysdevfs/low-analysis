import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const mockAdd = vi.fn();
const mockGetJob = vi.fn();

vi.mock('../modules/queue/queue.client.js', () => ({
  getQueue: vi.fn(() => ({ add: mockAdd, getJob: mockGetJob })),
}));

import app from '../app.js';
import { getQueue } from '../modules/queue/queue.client.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/queue/parse-law', () => {
  it('enqueues a parse_law job and returns 202 with jobId', async () => {
    mockAdd.mockResolvedValue({ id: '42' });

    const res = await request(app)
      .post('/api/queue/parse-law')
      .send({ url: '580-19' });

    expect(res.status).toBe(202);
    expect(res.body).toEqual({
      jobId: '42',
      queue: 'parse_law',
      state: 'queued',
    });
    expect(getQueue).toHaveBeenCalledWith('parse_law');
    expect(mockAdd).toHaveBeenCalledWith('parse_law', { url: '580-19' });
  });

  it('returns 400 when url is missing', async () => {
    const res = await request(app).post('/api/queue/parse-law').send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
    expect(mockAdd).not.toHaveBeenCalled();
  });
});

describe('GET /api/queue/status/:jobId', () => {
  it('returns 200 with the full job status when the job exists', async () => {
    mockGetJob.mockResolvedValue({
      id: '42',
      getState: vi.fn().mockResolvedValue('completed'),
      progress: 100,
      attemptsMade: 1,
      returnvalue: { lawId: 'law1', elementsCount: 756 },
      failedReason: null,
    });

    const res = await request(app).get('/api/queue/status/42');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      jobId: '42',
      queue: 'parse_law',
      state: 'completed',
      progress: 100,
      attemptsMade: 1,
      returnvalue: { lawId: 'law1', elementsCount: 756 },
      failedReason: null,
    });
  });

  it('normalizes missing returnvalue/failedReason to null', async () => {
    mockGetJob.mockResolvedValue({
      id: '7',
      getState: vi.fn().mockResolvedValue('active'),
      progress: 0,
      attemptsMade: 1,
      returnvalue: undefined,
      failedReason: undefined,
    });

    const res = await request(app).get('/api/queue/status/7');

    expect(res.status).toBe(200);
    expect(res.body.state).toBe('active');
    expect(res.body.returnvalue).toBeNull();
    expect(res.body.failedReason).toBeNull();
  });

  it('returns 404 when no queue holds the job', async () => {
    mockGetJob.mockResolvedValue(null);

    const res = await request(app).get('/api/queue/status/999999');

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });
});
