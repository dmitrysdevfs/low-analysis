import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';

vi.mock('../services/lawService.js', () => ({
  getAllLaws: vi.fn(),
  getLawById: vi.fn(),
  getLawTree: vi.fn(),
  getArticle: vi.fn(),
  getLawStats: vi.fn(),
  getLawStructure: vi.fn(),
  updateLawStatsFromDb: vi.fn(),
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
        searchIn: 'title',
        sortBy: 'date',
        sortOrder: 'desc',
      }),
    );
  });

  it('passes wordField=text to the service as searchIn=text', async () => {
    lawService.getAllLaws.mockResolvedValue(MOCK_PAGINATED);

    await request(app).get('/api/laws?q=викладацька&wordField=text');

    expect(lawService.getAllLaws).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'викладацька', searchIn: 'text' }),
    );
  });

  it('passes wordField=code to the service as searchIn=code', async () => {
    lawService.getAllLaws.mockResolvedValue(MOCK_PAGINATED);

    await request(app).get('/api/laws?q=580-19&wordField=code');

    expect(lawService.getAllLaws).toHaveBeenCalledWith(
      expect.objectContaining({ q: '580-19', searchIn: 'code' }),
    );
  });

  it('returns 400 for invalid wordField', async () => {
    const res = await request(app).get('/api/laws?wordField=invalid');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/wordField/);
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

  it('passes number and numberType to the service', async () => {
    lawService.getAllLaws.mockResolvedValue(MOCK_PAGINATED);

    await request(app).get('/api/laws?number=889-19&numberType=contains');

    expect(lawService.getAllLaws).toHaveBeenCalledWith(
      expect.objectContaining({ number: '889-19', numberType: 'contains' }),
    );
  });

  it('defaults numberType to "starts" when only number is provided', async () => {
    lawService.getAllLaws.mockResolvedValue(MOCK_PAGINATED);

    await request(app).get('/api/laws?number=889');

    expect(lawService.getAllLaws).toHaveBeenCalledWith(
      expect.objectContaining({ number: '889', numberType: 'starts' }),
    );
  });

  it('returns 400 for invalid numberType', async () => {
    const res = await request(app).get('/api/laws?numberType=invalid');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/numberType/);
  });

  it('passes subjectId to the service', async () => {
    lawService.getAllLaws.mockResolvedValue(MOCK_PAGINATED);

    await request(app).get('/api/laws?subjectId=507f1f77bcf86cd799439011');

    expect(lawService.getAllLaws).toHaveBeenCalledWith(
      expect.objectContaining({ subjectId: '507f1f77bcf86cd799439011' }),
    );
  });

  it('returns 400 for invalid subjectId', async () => {
    const res = await request(app).get('/api/laws?subjectId=not-an-objectid');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/subjectId/);
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

  it('returns 400 for limit=501', async () => {
    const res = await request(app).get('/api/laws?limit=501');

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

describe('GET /api/laws/:id/articles', () => {
  const MOCK_STRUCTURE = {
    title: 'CONSTITUTION OF UKRAINE',
    documentType: ['Закон України'],
    documentNumber: '254k/96-vr',
    adoptedDate: '1996-06-28T00:00:00.000Z',
    signatory: 'Президент України Л.КУЧМА',
    status: 'Чинний',
    articles: [
      { number: '1', title: 'Стаття 1.' },
      { number: '2', title: 'Стаття 2.' },
    ],
  };

  it('returns 200 with law structure and articles list', async () => {
    lawService.getLawStructure.mockResolvedValue(MOCK_STRUCTURE);

    const res = await request(app).get(`/api/laws/${MOCK_LAW._id}/articles`);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe(MOCK_STRUCTURE.title);
    expect(res.body.documentType).toEqual(MOCK_STRUCTURE.documentType);
    expect(res.body.documentNumber).toBe(MOCK_STRUCTURE.documentNumber);
    expect(res.body.adoptedDate).toBe(MOCK_STRUCTURE.adoptedDate);
    expect(res.body.signatory).toBe(MOCK_STRUCTURE.signatory);
    expect(res.body.status).toBe(MOCK_STRUCTURE.status);
    expect(Array.isArray(res.body.articles)).toBe(true);
    expect(res.body.articles).toHaveLength(2);
    expect(res.body.articles[0]).toEqual({ number: '1', title: 'Стаття 1.' });
  });

  it('returns articles with number and title fields', async () => {
    lawService.getLawStructure.mockResolvedValue(MOCK_STRUCTURE);

    const res = await request(app).get(`/api/laws/${MOCK_LAW._id}/articles`);

    expect(res.status).toBe(200);
    res.body.articles.forEach((article) => {
      expect(article).toHaveProperty('number');
      expect(article).toHaveProperty('title');
    });
  });

  it('returns empty articles array when law has no articles', async () => {
    lawService.getLawStructure.mockResolvedValue({
      ...MOCK_STRUCTURE,
      articles: [],
    });

    const res = await request(app).get(`/api/laws/${MOCK_LAW._id}/articles`);

    expect(res.status).toBe(200);
    expect(res.body.articles).toEqual([]);
  });

  it('returns nullable fields as null when not set', async () => {
    lawService.getLawStructure.mockResolvedValue({
      ...MOCK_STRUCTURE,
      adoptedDate: null,
      signatory: null,
      status: null,
    });

    const res = await request(app).get(`/api/laws/${MOCK_LAW._id}/articles`);

    expect(res.status).toBe(200);
    expect(res.body.adoptedDate).toBeNull();
    expect(res.body.signatory).toBeNull();
    expect(res.body.status).toBeNull();
  });

  it('returns 404 when law not found', async () => {
    lawService.getLawStructure.mockResolvedValue(null);

    const res = await request(app).get(
      '/api/laws/000000000000000000000000/articles',
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Law not found');
  });
});

describe('GET /api/laws/:id/stats', () => {
  it('returns 200 with stats object', async () => {
    const mockStats = {
      totalElements: 10,
      meanChars: 150,
      standardDeviation: 50,
      riskLevels: { green: 8, yellow: 1, red: 1, null: 0 },
    };
    lawService.getLawStats.mockResolvedValue(mockStats);

    const res = await request(app).get(`/api/laws/${MOCK_LAW._id}/stats`);

    expect(res.status).toBe(200);
    expect(res.body.totalElements).toBe(10);
    expect(res.body.meanChars).toBe(150);
    expect(res.body.standardDeviation).toBe(50);
    expect(res.body.riskLevels.green).toBe(8);
  });

  it('returns 404 when stats not found', async () => {
    lawService.getLawStats.mockResolvedValue(null);

    const res = await request(app).get(`/api/laws/${MOCK_LAW._id}/stats`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Stats not found for this law');
  });
});
