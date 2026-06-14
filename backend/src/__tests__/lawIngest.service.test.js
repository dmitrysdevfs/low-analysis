import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/fetchService.js', () => ({
  extractLawCode: vi.fn(),
  fetchLawData: vi.fn(),
}));
vi.mock('../services/parserService.js', () => ({
  parseLawHtml: vi.fn(),
}));
vi.mock('../services/lawService.js', () => ({
  upsertLaw: vi.fn(),
  resolveElementHierarchy: vi.fn(),
  bulkUpsertElements: vi.fn(),
  deleteMissingElements: vi.fn(),
  updateLawStatsFromDb: vi.fn(),
}));
vi.mock('../services/statisticalAnalysisService.js', () => ({
  performStatisticalAnalysis: vi.fn(),
}));

import { parseAndSaveLawByUrl } from '../services/lawIngest.service.js';
import * as fetchService from '../services/fetchService.js';
import { parseLawHtml } from '../services/parserService.js';
import * as lawService from '../services/lawService.js';
import { performStatisticalAnalysis } from '../services/statisticalAnalysisService.js';

const VALID_PARSED = {
  title: 'Test Law',
  code: '580-19',
  status: 'active',
  preamble: 'preamble',
  signatory: 'signatory',
  adoptedDate: null,
  documentType: ['Закон'],
  global_context: {},
  elements: [{ code: 'st1' }],
};

// Wires up the happy-path mocks; individual tests override what they need.
function mockHappyPath() {
  fetchService.extractLawCode.mockReturnValue('580-19');
  fetchService.fetchLawData.mockResolvedValue({
    mainHtml: 'm',
    frameHtml: 'f',
  });
  parseLawHtml.mockReturnValue({ ...VALID_PARSED });
  lawService.upsertLaw.mockResolvedValue({ _id: 'law1' });
  lawService.resolveElementHierarchy.mockResolvedValue({
    elementsToSave: [{ a: 1 }, { a: 2 }],
    activeCodes: ['st1', 'st2'],
  });
  lawService.bulkUpsertElements.mockResolvedValue();
  lawService.deleteMissingElements.mockResolvedValue();
  lawService.updateLawStatsFromDb.mockResolvedValue();
  performStatisticalAnalysis.mockResolvedValue();
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('parseAndSaveLawByUrl', () => {
  it('throws 400 when url is missing', async () => {
    await expect(parseAndSaveLawByUrl()).rejects.toMatchObject({
      statusCode: 400,
      message: 'URL or law code is required',
    });
  });

  it('throws 400 when a law code cannot be extracted', async () => {
    fetchService.extractLawCode.mockReturnValue(null);

    await expect(parseAndSaveLawByUrl('not-a-law')).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(fetchService.fetchLawData).not.toHaveBeenCalled();
  });

  it('throws 500 when the parsed HTML has no title', async () => {
    fetchService.extractLawCode.mockReturnValue('580-19');
    fetchService.fetchLawData.mockResolvedValue({
      mainHtml: 'm',
      frameHtml: 'f',
    });
    parseLawHtml.mockReturnValue({ title: null, code: null });

    await expect(parseAndSaveLawByUrl('580-19')).rejects.toMatchObject({
      statusCode: 500,
    });
    expect(lawService.upsertLaw).not.toHaveBeenCalled();
  });

  it('parses and saves a law, returning lawId + elementsCount', async () => {
    mockHappyPath();

    const result = await parseAndSaveLawByUrl('580-19');

    expect(result).toEqual({ lawId: 'law1', elementsCount: 2 });
    expect(lawService.upsertLaw).toHaveBeenCalledOnce();
    expect(lawService.bulkUpsertElements).toHaveBeenCalledWith([
      { a: 1 },
      { a: 2 },
    ]);
    expect(lawService.deleteMissingElements).toHaveBeenCalledWith('law1', [
      'st1',
      'st2',
    ]);
    expect(lawService.updateLawStatsFromDb).toHaveBeenCalledWith('law1');
  });

  it('falls back to the extracted code when the parser omits code', async () => {
    mockHappyPath();
    parseLawHtml.mockReturnValue({ ...VALID_PARSED, code: null });

    await parseAndSaveLawByUrl('580-19');

    expect(lawService.upsertLaw).toHaveBeenCalledWith(
      expect.objectContaining({ code: '580-19' }),
    );
  });

  it('does not fail the ingest when statistical analysis throws', async () => {
    mockHappyPath();
    performStatisticalAnalysis.mockRejectedValue(new Error('stats boom'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await parseAndSaveLawByUrl('580-19');

    expect(result).toEqual({ lawId: 'law1', elementsCount: 2 });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
