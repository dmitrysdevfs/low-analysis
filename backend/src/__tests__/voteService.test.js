import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as voteService from '../services/voteService.js';
import Vote from '../models/Vote.js';
import Amendment from '../models/Amendment.js';
import Proposal from '../models/Proposal.js';

vi.mock('../models/Vote.js');
vi.mock('../models/Amendment.js');
vi.mock('../models/Proposal.js');

describe('voteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('castVote', () => {
    it('should upsert vote and update summary', async () => {
      Vote.findOneAndUpdate.mockResolvedValue({});
      Vote.aggregate.mockResolvedValue([
        { _id: 'positive', count: 5 },
        { _id: 'negative', count: 1 },
      ]);
      Amendment.findByIdAndUpdate.mockResolvedValue({ proposal_id: 'p1' });
      Amendment.aggregate.mockResolvedValue([
        { positive: 10, neutral: 2, negative: 3 },
      ]);
      Proposal.findByIdAndUpdate.mockResolvedValue({
        _id: 'p1',
        votes_summary: { positive: 10, neutral: 2, negative: 3 },
      });

      const result = await voteService.castVote({
        amendment_id: 'a1',
        user_id: 'u1',
        value: 'positive',
      });

      expect(Vote.findOneAndUpdate).toHaveBeenCalled();
      expect(Amendment.findByIdAndUpdate).toHaveBeenCalledWith(
        'a1',
        expect.objectContaining({
          votes_summary: expect.objectContaining({ positive: 5 }),
        }),
        expect.any(Object),
      );
      expect(Proposal.findByIdAndUpdate).toHaveBeenCalled();
      expect(result.positive).toBe(5);
    });
  });
});
