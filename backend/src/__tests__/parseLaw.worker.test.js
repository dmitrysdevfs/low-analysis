import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('#services/lawIngest.service.js', () => ({
  parseAndSaveLawByUrl: vi.fn(),
}));

import { processParseLawJob } from '../modules/queue/workers/parseLaw.worker.js';
import { parseAndSaveLawByUrl } from '#services/lawIngest.service.js';

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('processParseLawJob', () => {
  it('calls parseAndSaveLawByUrl with the job url and returns its result', async () => {
    parseAndSaveLawByUrl.mockResolvedValue({ lawId: 'law1', elementsCount: 5 });

    const result = await processParseLawJob({
      id: '1',
      data: { url: '580-19' },
    });

    expect(parseAndSaveLawByUrl).toHaveBeenCalledWith('580-19');
    expect(result).toEqual({ lawId: 'law1', elementsCount: 5 });
  });

  it('propagates errors so BullMQ can mark the job failed', async () => {
    parseAndSaveLawByUrl.mockRejectedValue(new Error('parse failed'));

    await expect(
      processParseLawJob({ id: '2', data: { url: 'bad' } }),
    ).rejects.toThrow('parse failed');
  });
});
