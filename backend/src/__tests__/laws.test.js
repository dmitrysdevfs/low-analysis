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

const MOCK_PAGINATED = {
  data: [MOCK_LAW],
  pagination: {
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

describe('GET /api/laws', () => {
  it('returns 200 with paginated response', async () => {
    lawService.getAllLaws.mockResolvedValue(MOCK_PAGINATED);

    const res = await request(app).get('/api/laws');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]._id).toBe(MOCK_LAW._id);
    expect(res.body.pagination).toBeDefined();
  });

  it('passes the q query to the service', async () => {
    lawService.getAllLaws.mockResolvedValue(MOCK_PAGINATED);

    await request(app).get('/api/laws?q=constitution');

    expect(lawService.getAllLaws).toHaveBeenCalledWith(
      expect.objectContaining({
        q: 'constitution',
        sortBy: 'date',
        sortOrder: 'desc',
      }),
    );
  });

  it('passes sortBy and sortOrder to the service', async () => {
    lawService.getAllLaws.mockResolvedValue(MOCK_PAGINATED);

    await request(app).get('/api/laws?sortBy=title&sortOrder=asc');

    expect(lawService.getAllLaws).toHaveBeenCalledWith(
      expect.objectContaining({
        q: '',
        sortBy: 'title',
        sortOrder: 'asc',
      }),
    );
  });

  it('returns 400 for invalid sortBy', async () => {
    const res = await request(app).get('/api/laws?sortBy=invalid');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/sortBy/);
  });

  it('returns 400 for invalid sortOrder', async () => {
    const res = await request(app).get('/api/laws?sortOrder=random');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/sortOrder/);
  });

  it('passes status filter to the service', async () => {
    lawService.getAllLaws.mockResolvedValue(MOCK_PAGINATED);

    await request(app).get('/api/laws?status=Чинний');

    expect(lawService.getAllLaws).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'Чинний' }),
    );
  });

  it('passes dateFrom and dateTo to the service as Date objects', async () => {
    lawService.getAllLaws.mockResolvedValue(MOCK_PAGINATED);

    await request(app).get('/api/laws?dateFrom=2020-01-01&dateTo=2020-12-31');

    expect(lawService.getAllLaws).toHaveBeenCalledWith(
      expect.objectContaining({
        dateFrom: expect.any(Date),
        dateTo: expect.any(Date),
      }),
    );
  });

  it('returns 400 for invalid dateFrom', async () => {
    const res = await request(app).get('/api/laws?dateFrom=not-a-date');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/dateFrom/);
  });

  it('returns 400 for invalid dateTo', async () => {
    const res = await request(app).get('/api/laws?dateTo=not-a-date');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/dateTo/);
  });

  it('passes documentType filter to the service', async () => {
    lawService.getAllLaws.mockResolvedValue(MOCK_PAGINATED);

    await request(app).get('/api/laws?documentType=Закон України');

    expect(lawService.getAllLaws).toHaveBeenCalledWith(
      expect.objectContaining({ documentType: 'Закон України' }),
    );
  });

  it('returns 200 when documentType is not provided', async () => {
    lawService.getAllLaws.mockResolvedValue(MOCK_PAGINATED);

    const res = await request(app).get('/api/laws');

    expect(res.status).toBe(200);
    expect(lawService.getAllLaws).toHaveBeenCalledWith(
      expect.objectContaining({ documentType: undefined }),
    );
  });

  it('passes page and limit to the service', async () => {
    lawService.getAllLaws.mockResolvedValue(MOCK_PAGINATED);

    await request(app).get('/api/laws?page=2&limit=5');

    expect(lawService.getAllLaws).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 5 }),
    );
  });

  it('returns 400 for page=0', async () => {
    const res = await request(app).get('/api/laws?page=0');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/page/);
  });

  it('returns 400 for page=abc', async () => {
    const res = await request(app).get('/api/laws?page=abc');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/page/);
  });

  it('returns 400 for limit=0', async () => {
    const res = await request(app).get('/api/laws?limit=0');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/limit/);
  });

  it('returns 400 for limit=101', async () => {
    const res = await request(app).get('/api/laws?limit=101');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/limit/);
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
