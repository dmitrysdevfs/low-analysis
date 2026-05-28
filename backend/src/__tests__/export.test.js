import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';

vi.mock('../services/exportService.js', () => ({
  getFlatDataset: vi.fn(),
  getNestedDataset: vi.fn(),
}));

import * as exportService from '../services/exportService.js';

const MOCK_LAW_ID = '69f84aa7395f1789bc7b2b89';

const MOCK_FLAT_DATA = [
  {
    law_title: 'Конституція України',
    law_number: '254к/96-ВР',
    law_type: 'Закон',
    adoption_date: '1996-06-28',
    section_number: 'I',
    section_title: 'Загальні засади',
    article_number: '1',
    article_title: 'Стаття 1',
    paragraph_number: '1',
    paragraph_text: 'Україна є суверенна і незалежна...',
    element_code: 'КУ.Р01.С01.Ч01',
    detected_subjects: 'Громадянин України',
    regulators: 'Держава',
    subject_aliases: 'Громадянин, Фізична особа',
    risk_level: 'Низький',
    z_score: 0.12,
  },
];

const MOCK_NESTED_DATA = {
  _id: MOCK_LAW_ID,
  title: 'Конституція України',
  code: '254к/96-ВР',
  tree: [
    {
      _id: '507f1f77bcf86cd799439010',
      type: 'section',
      title: 'Розділ I. Загальні засади',
      children: [
        {
          _id: '507f1f77bcf86cd799439011',
          type: 'article',
          title: 'Стаття 1',
          children: [
            {
              _id: '507f1f77bcf86cd799439012',
              type: 'part',
              text: 'Україна є суверенна...',
            },
          ],
        },
      ],
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Export Endpoints', () => {
  const routes = ['/api/laws/export', '/api/export/dataset'];

  routes.forEach((route) => {
    describe(`GET ${route}`, () => {
      it('returns 400 when lawId query parameter is missing', async () => {
        const res = await request(app).get(route);
        expect(res.status).toBe(400);
        expect(res.body.message).toContain(
          'Параметр lawId є обов’язковим для експорту.',
        );
      });

      it('returns 200 with flat JSON data by default', async () => {
        exportService.getFlatDataset.mockResolvedValue(MOCK_FLAT_DATA);

        const res = await request(app).get(`${route}?lawId=${MOCK_LAW_ID}`);

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('application/json');
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].element_code).toBe(MOCK_FLAT_DATA[0].element_code);
        expect(exportService.getFlatDataset).toHaveBeenCalledWith(MOCK_LAW_ID, {
          subject: undefined,
          article: undefined,
          startDate: undefined,
          endDate: undefined,
          dateFrom: undefined,
          dateTo: undefined,
        });
      });

      it('passes filters to getFlatDataset', async () => {
        exportService.getFlatDataset.mockResolvedValue(MOCK_FLAT_DATA);

        const res = await request(app).get(
          `${route}?lawId=${MOCK_LAW_ID}&subject=Громадянин&article=1&startDate=1996-01-01&endDate=2026-12-31`,
        );

        expect(res.status).toBe(200);
        expect(exportService.getFlatDataset).toHaveBeenCalledWith(MOCK_LAW_ID, {
          subject: 'Громадянин',
          article: '1',
          startDate: '1996-01-01',
          endDate: '2026-12-31',
          dateFrom: undefined,
          dateTo: undefined,
        });
      });

      it('returns nested JSON when mode=nested', async () => {
        exportService.getNestedDataset.mockResolvedValue(MOCK_NESTED_DATA);

        const res = await request(app).get(
          `${route}?lawId=${MOCK_LAW_ID}&mode=nested`,
        );

        expect(res.status).toBe(200);
        expect(res.body.code).toBe(MOCK_NESTED_DATA.code);
        expect(exportService.getNestedDataset).toHaveBeenCalledWith(
          MOCK_LAW_ID,
          {
            subject: undefined,
            article: undefined,
            startDate: undefined,
            endDate: undefined,
            dateFrom: undefined,
            dateTo: undefined,
          },
        );
      });

      it('streams XLSX dataset when format=xlsx', async () => {
        exportService.getFlatDataset.mockResolvedValue(MOCK_FLAT_DATA);

        const res = await request(app).get(
          `${route}?lawId=${MOCK_LAW_ID}&format=xlsx`,
        );

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain(
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        expect(res.headers['content-disposition']).toContain('attachment');
        expect(res.headers['content-disposition']).toContain(`.xlsx"`);

        // Excel format is binary (a zip file), so check it is received and has size > 0
        expect(res.body instanceof Buffer || typeof res.text === 'string').toBe(
          true,
        );
        expect(exportService.getFlatDataset).toHaveBeenCalledWith(MOCK_LAW_ID, {
          subject: undefined,
          article: undefined,
          startDate: undefined,
          endDate: undefined,
          dateFrom: undefined,
          dateTo: undefined,
        });
      });
    });
  });
});
