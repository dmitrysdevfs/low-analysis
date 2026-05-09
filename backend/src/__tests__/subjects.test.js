import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';

vi.mock('../services/subjectService.js', () => ({
  getAllSubjects: vi.fn(),
  getSubjectElements: vi.fn(),
}));

import * as subjectService from '../services/subjectService.js';

const MOCK_SUBJECT = {
  _id: '507f1f77bcf86cd799439022',
  name: 'Entrepreneur',
  aliases: ['FOP'],
  elementIds: [],
  lawIds: [],
};

const MOCK_ELEMENT = {
  _id: '507f1f77bcf86cd799439011',
  type: 'article',
  code: 'rz1.st1',
  depth: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/subjects', () => {
  it('returns 200 with array of subjects', async () => {
    subjectService.getAllSubjects.mockResolvedValue([MOCK_SUBJECT]);

    const res = await request(app).get('/api/subjects');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]._id).toBe(MOCK_SUBJECT._id);
  });
});

describe('GET /api/subjects/:id/elements', () => {
  it('returns 200 with subject and elements', async () => {
    subjectService.getSubjectElements.mockResolvedValue({
      subject: MOCK_SUBJECT,
      elements: [MOCK_ELEMENT],
    });

    const res = await request(app).get(
      `/api/subjects/${MOCK_SUBJECT._id}/elements`,
    );

    expect(res.status).toBe(200);
    expect(res.body.subject._id).toBe(MOCK_SUBJECT._id);
    expect(Array.isArray(res.body.elements)).toBe(true);
  });

  it('returns 404 when subject not found', async () => {
    subjectService.getSubjectElements.mockResolvedValue(null);

    const res = await request(app).get(
      '/api/subjects/000000000000000000000000/elements',
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Subject not found');
  });
});
