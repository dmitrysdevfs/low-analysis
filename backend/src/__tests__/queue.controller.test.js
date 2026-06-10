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

describe('POST /api/queue/analyze-subjects', () => {
  it('enqueues an analyze_subjects job and returns 202 with jobId', async () => {
    mockAdd.mockResolvedValue({ id: '43' });

    const res = await request(app)
      .post('/api/queue/analyze-subjects')
      .send({ lawId: 'law1' });

    expect(res.status).toBe(202);
    expect(res.body).toEqual({
      jobId: '43',
      queue: 'analyze_subjects',
      state: 'queued',
    });
    expect(getQueue).toHaveBeenCalledWith('analyze_subjects');
    expect(mockAdd).toHaveBeenCalledWith('analyze_subjects', {
      lawId: 'law1',
      force: false,
    });
  });

  it('passes force through to the job payload', async () => {
    mockAdd.mockResolvedValue({ id: '44' });

    await request(app)
      .post('/api/queue/analyze-subjects')
      .send({ lawId: 'law1', force: true });

    expect(mockAdd).toHaveBeenCalledWith('analyze_subjects', {
      lawId: 'law1',
      force: true,
    });
  });

  it('returns 400 when lawId is missing', async () => {
    const res = await request(app).post('/api/queue/analyze-subjects').send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
    expect(mockAdd).not.toHaveBeenCalled();
  });
});

describe('POST /api/queue/batch-update-law-tree', () => {
  it('enqueues a batch_update_law_tree job and returns 202 with jobId', async () => {
    mockAdd.mockResolvedValue({ id: '51' });

    const res = await request(app)
      .post('/api/queue/batch-update-law-tree')
      .send({ codes: ['254к/96-вр', '580-19'] });

    expect(res.status).toBe(202);
    expect(res.body).toEqual({
      jobId: '51',
      queue: 'batch_update_law_tree',
      state: 'queued',
    });
    expect(getQueue).toHaveBeenCalledWith('batch_update_law_tree');
    expect(mockAdd).toHaveBeenCalledWith('batch_update_law_tree', {
      codes: ['254к/96-вр', '580-19'],
    });
  });

  it('returns 400 when codes is missing', async () => {
    const res = await request(app)
      .post('/api/queue/batch-update-law-tree')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/codes/i);
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it('returns 400 when codes is an empty array', async () => {
    const res = await request(app)
      .post('/api/queue/batch-update-law-tree')
      .send({ codes: [] });

    expect(res.status).toBe(400);
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it('returns 400 when codes is not an array', async () => {
    const res = await request(app)
      .post('/api/queue/batch-update-law-tree')
      .send({ codes: '580-19' });

    expect(res.status).toBe(400);
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
