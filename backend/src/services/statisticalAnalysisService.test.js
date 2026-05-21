import { describe, expect, it, vi, beforeEach } from 'vitest';
import { performStatisticalAnalysis } from './statisticalAnalysisService.js';

vi.mock('../models/Element.js', () => {
  return {
    default: {
      find: vi.fn(),
      bulkWrite: vi.fn(),
    },
  };
});

import Element from '../models/Element.js';

describe('performStatisticalAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws an error if no elements are found', async () => {
    Element.find.mockResolvedValue([]);

    await expect(performStatisticalAnalysis('some-law-id')).rejects.toThrow(
      'No elements found for the specified law.',
    );
  });

  it('calculates statistical metrics, z-scores, risk levels and calls bulkWrite', async () => {
    const mockElements = [
      { _id: '1', text: 'a'.repeat(10), subjects: [1, 2] }, // length 10, subjects 2
      { _id: '2', text: 'a'.repeat(20), subjects: [1] }, // length 20, subjects 1
      { _id: '3', text: 'a'.repeat(30), subjects: [] }, // length 30, subjects 0
    ];
    Element.find.mockResolvedValue(mockElements);
    Element.bulkWrite.mockResolvedValue({});

    // Mean length: (10 + 20 + 30) / 3 = 20.
    // Variance: ((10-20)^2 + (20-20)^2 + (30-20)^2) / 3 = (100 + 0 + 100) / 3 = 66.67
    // StdDev: sqrt(66.67) = 8.165
    // Z-scores:
    // 1: (10 - 20) / 8.165 = -1.22 (green)
    // 2: (20 - 20) / 8.165 = 0 (green)
    // 3: (30 - 20) / 8.165 = 1.22 (yellow)

    const result = await performStatisticalAnalysis('law-123');

    expect(Element.find).toHaveBeenCalledWith({ lawId: 'law-123' });
    expect(result.totalElements).toBe(3);
    expect(result.meanChars).toBe(20);
    expect(result.standardDeviation).toBeCloseTo(8.165, 3);

    expect(Element.bulkWrite).toHaveBeenCalledTimes(1);
    const bulkOps = Element.bulkWrite.mock.calls[0][0];
    expect(bulkOps).toHaveLength(3);

    // Verify first update operation
    expect(bulkOps[0]).toEqual({
      updateOne: {
        filter: { _id: '1' },
        update: {
          $set: {
            chars_count: 10,
            subjects_count: 2,
            z_score: expect.any(Number),
            risk_level: 'green',
          },
        },
      },
    });

    // Verify third update operation (z_score = 1.22, risk_level should be yellow)
    expect(bulkOps[2]).toEqual({
      updateOne: {
        filter: { _id: '3' },
        update: {
          $set: {
            chars_count: 30,
            subjects_count: 0,
            z_score: expect.any(Number),
            risk_level: 'yellow',
          },
        },
      },
    });
    expect(bulkOps[2].updateOne.update.$set.z_score).toBeGreaterThan(1);
  });
});
