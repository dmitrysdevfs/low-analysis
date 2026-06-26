import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../modules/pages/page.service.js', () => ({
  getKnownPageSlugs: vi.fn(),
  getPublicPage: vi.fn(),
  getAdminPage: vi.fn(),
  saveDraftPage: vi.fn(),
  publishPage: vi.fn(),
  unpublishPage: vi.fn(),
  getPageVersions: vi.fn(),
  restorePageVersion: vi.fn(),
}));

vi.mock('../middleware/authMiddleware.js', () => ({
  protect: (req, _res, next) => {
    req.user = { _id: 'admin-user-id', role: 'admin' };
    next();
  },
  optionalProtect: (req, _res, next) => {
    req.user = { _id: 'admin-user-id', role: 'admin' };
    next();
  },
  authorize: () => (_req, _res, next) => next(),
  hasPermission: () => (_req, _res, next) => next(),
}));

import app from '../app.js';
import * as pageService from '../modules/pages/page.service.js';

const PUBLIC_PAGE = {
  slug: 'project-info',
  status: 'published',
  title: 'Інформація про проєкт',
  description: 'Публічна сторінка про платформу.',
  seo: {
    title: 'Інформація про проєкт | Low Analysis',
    description: 'Опис платформи',
    ogImage: '',
  },
  blocks: [],
  updatedAt: new Date('2026-05-26T12:00:00.000Z').toISOString(),
  publishedAt: new Date('2026-05-26T12:00:00.000Z').toISOString(),
};

const ADMIN_PAGE = {
  slug: 'project-info',
  title: 'Інформація про проєкт',
  status: 'published',
  draft: {
    title: 'Інформація про проєкт',
    description: 'Draft сторінки.',
    seo: {
      title: 'Інформація про проєкт | Low Analysis',
      description: 'Draft seo',
      ogImage: '',
    },
    blocks: [],
  },
  published: {
    title: 'Інформація про проєкт',
    description: 'Published сторінки.',
    seo: {
      title: 'Інформація про проєкт | Low Analysis',
      description: 'Published seo',
      ogImage: '',
    },
    blocks: [],
  },
  versions: [
    {
      version: 2,
      kind: 'publish',
      savedAt: new Date('2026-05-26T12:00:00.000Z').toISOString(),
      savedBy: 'admin-user-id',
      title: 'Інформація про проєкт',
      blockCount: 0,
    },
  ],
  updatedAt: new Date('2026-05-26T12:00:00.000Z').toISOString(),
  publishedAt: new Date('2026-05-26T12:00:00.000Z').toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Pages API', () => {
  it('returns the page catalog', async () => {
    pageService.getKnownPageSlugs.mockReturnValue([
      { slug: 'project-info', label: 'Інформація про проєкт' },
    ]);

    const res = await request(app).get('/api/pages');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { slug: 'project-info', label: 'Інформація про проєкт' },
    ]);
  });

  it('returns a published public page', async () => {
    pageService.getPublicPage.mockResolvedValue(PUBLIC_PAGE);

    const res = await request(app).get('/api/pages/project-info');

    expect(res.status).toBe(200);
    expect(res.body.slug).toBe('project-info');
    expect(res.body.title).toBe('Інформація про проєкт');
  });

  it('returns the admin page model', async () => {
    pageService.getAdminPage.mockResolvedValue(ADMIN_PAGE);

    const res = await request(app).get('/api/admin/pages/project-info');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('published');
    expect(Array.isArray(res.body.versions)).toBe(true);
  });

  it('saves a draft payload through the admin route', async () => {
    pageService.saveDraftPage.mockResolvedValue(ADMIN_PAGE);

    const payload = {
      title: 'Інформація про проєкт',
      description: 'Оновлений опис',
      seo: {
        title: 'Інформація про проєкт | Low Analysis',
        description: 'SEO',
        ogImage: '',
      },
      blocks: [],
    };

    const res = await request(app)
      .put('/api/admin/pages/project-info')
      .send(payload);

    expect(res.status).toBe(200);
    expect(pageService.saveDraftPage).toHaveBeenCalledWith(
      'project-info',
      payload,
      'admin-user-id',
    );
  });
});
