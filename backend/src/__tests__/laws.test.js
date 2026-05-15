import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';

vi.mock('../services/lawService.js', () => ({
  getAllLaws: vi.fn(),
  getLawById: vi.fn(),
  getLawTree: vi.fn(),
  getArticle: vi.fn(),
}));

import * as lawService from '../services/lawService.js';

const MOCK_LAW = {
  _id: '69f84aa7395f1789bc7b2b89',
  title: 'CONSTITUTION OF UKRAINE',
  code: '254k/96-vr',
  totalArticles: 166,
  totalSections: 14,
};

const MOCK_ELEMENT = {
  _id: '507f1f77bcf86cd799439011',
  lawId: '69f84aa7395f1789bc7b2b89',
  type: 'article',
  code: 'rz1.st1',
  number: '1',
  depth: 1,
  order: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/laws', () => {
  it('returns 200 with array of laws', async () => {
    lawService.getAllLaws.mockResolvedValue([MOCK_LAW]);

    const res = await request(app).get('/api/laws');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]._id).toBe(MOCK_LAW._id);
  });

  it('passes the q query to the service', async () => {
    lawService.getAllLaws.mockResolvedValue([]);

    await request(app).get('/api/laws?q=constitution');

    expect(lawService.getAllLaws).toHaveBeenCalledWith('constitution');
  });
});

describe('GET /api/laws/:id/tree', () => {
  it('returns 200 with law and elements', async () => {
    lawService.getLawById.mockResolvedValue(MOCK_LAW);
    lawService.getLawTree.mockResolvedValue([MOCK_ELEMENT]);

    const res = await request(app).get(`/api/laws/${MOCK_LAW._id}/tree`);

    expect(res.status).toBe(200);
    expect(res.body.law._id).toBe(MOCK_LAW._id);
    expect(Array.isArray(res.body.elements)).toBe(true);
  });

  it('returns 404 when law not found', async () => {
    lawService.getLawById.mockResolvedValue(null);

    const res = await request(app).get(
      '/api/laws/000000000000000000000000/tree',
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Law not found');
  });
});

describe('GET /api/laws/:id/articles/:num', () => {
  it('returns 200 with lawUrl, article and children', async () => {
    lawService.getArticle.mockResolvedValue({
      lawUrl: 'https://zakon.rada.gov.ua/laws/show/254k/96-vr#Text',
      article: MOCK_ELEMENT,
      children: [],
    });

    const res = await request(app).get(`/api/laws/${MOCK_LAW._id}/articles/1`);

    expect(res.status).toBe(200);
    expect(res.body.lawUrl).toBe(
      'https://zakon.rada.gov.ua/laws/show/254k/96-vr#Text',
    );
    expect(res.body.article._id).toBe(MOCK_ELEMENT._id);
    expect(Array.isArray(res.body.children)).toBe(true);
  });

  it('returns lawUrl as null when law has no source', async () => {
    lawService.getArticle.mockResolvedValue({
      lawUrl: null,
      article: MOCK_ELEMENT,
      children: [],
    });

    const res = await request(app).get(`/api/laws/${MOCK_LAW._id}/articles/1`);

    expect(res.status).toBe(200);
    expect(res.body.lawUrl).toBeNull();
  });

  it('returns 404 when article not found', async () => {
    lawService.getArticle.mockResolvedValue(null);

    const res = await request(app).get(
      `/api/laws/${MOCK_LAW._id}/articles/999`,
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Article not found');
  });
});
