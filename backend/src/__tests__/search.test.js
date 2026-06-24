import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';

vi.mock('../services/searchService.js', () => ({
  search: vi.fn(),
  buildSnippet: vi.fn(),
}));

import * as searchService from '../services/searchService.js';

const MOCK_RESULTS = {
  data: [
    {
      law_id: '69f84aa7395f1789bc7b2b89',
      law_name: 'Податковий кодекс України',
      article_number: '15',
      article_title: 'Платники податків',
      snippet: '…платником податку є особа…',
      match_type: 'article',
    },
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/search', () => {
  it('returns 200 with paginated results', async () => {
    searchService.search.mockResolvedValue(MOCK_RESULTS);

    const res = await request(app).get('/api/search?q=податок');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].match_type).toBe('article');
    expect(res.body.pagination).toBeDefined();
  });

  it('defaults type to "all" and passes the query to the service', async () => {
    searchService.search.mockResolvedValue(MOCK_RESULTS);

    await request(app).get('/api/search?q=податок');

    expect(searchService.search).toHaveBeenCalledWith(
      expect.objectContaining({
        q: 'податок',
        type: 'all',
        page: 1,
        limit: 20,
      }),
    );
  });

  it('passes type, status and dates through to the service', async () => {
    searchService.search.mockResolvedValue(MOCK_RESULTS);

    await request(app).get(
      '/api/search?q=податок&type=article&status=Чинний&dateFrom=2020-01-01&dateTo=2023-12-31',
    );

    expect(searchService.search).toHaveBeenCalledWith(
      expect.objectContaining({
        q: 'податок',
        type: 'article',
        status: 'Чинний',
        dateFrom: expect.any(Date),
        dateTo: expect.any(Date),
      }),
    );
  });

  it('returns 400 when q is missing', async () => {
    const res = await request(app).get('/api/search');

    expect(res.status).toBe(400);
    expect(searchService.search).not.toHaveBeenCalled();
  });

  it('returns 400 when q is empty/whitespace', async () => {
    const res = await request(app).get('/api/search?q=%20%20');

    expect(res.status).toBe(400);
    expect(searchService.search).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid type', async () => {
    const res = await request(app).get('/api/search?q=податок&type=bogus');

    expect(res.status).toBe(400);
    expect(searchService.search).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid date', async () => {
    const res = await request(app).get(
      '/api/search?q=податок&dateFrom=not-a-date',
    );

    expect(res.status).toBe(400);
    expect(searchService.search).not.toHaveBeenCalled();
  });

  it('passes subjectId through to the service', async () => {
    searchService.search.mockResolvedValue(MOCK_RESULTS);

    await request(app).get(
      '/api/search?q=фінанси&subjectId=507f1f77bcf86cd799439022',
    );

    expect(searchService.search).toHaveBeenCalledWith(
      expect.objectContaining({
        q: 'фінанси',
        subjectId: '507f1f77bcf86cd799439022',
      }),
    );
  });

  it('allows subjectId without q (subject-only search)', async () => {
    searchService.search.mockResolvedValue(MOCK_RESULTS);

    const res = await request(app).get(
      '/api/search?subjectId=507f1f77bcf86cd799439022',
    );

    expect(res.status).toBe(200);
    expect(searchService.search).toHaveBeenCalledWith(
      expect.objectContaining({ subjectId: '507f1f77bcf86cd799439022' }),
    );
  });

  it('returns 400 for an invalid subjectId', async () => {
    const res = await request(app).get('/api/search?subjectId=not-an-id');

    expect(res.status).toBe(400);
    expect(searchService.search).not.toHaveBeenCalled();
  });
});
