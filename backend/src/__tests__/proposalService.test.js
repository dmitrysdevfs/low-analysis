import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as proposalService from '../services/proposalService.js';
import Proposal from '../models/Proposal.js';

vi.mock('../models/Proposal.js');
vi.mock('../models/Amendment.js');
vi.mock('../models/Law.js');

describe('proposalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProposal', () => {
    it('should create a proposal', async () => {
      Proposal.create.mockResolvedValue({ _id: 'p1', title: 'Test' });
      const result = await proposalService.createProposal({ title: 'Test' });
      expect(Proposal.create).toHaveBeenCalled();
      expect(result.title).toBe('Test');
    });
  });

  describe('submitProposal', () => {
    it('should change status to review if draft', async () => {
      const mockProposal = {
        _id: 'p1',
        created_by: 'u1',
        status: 'draft',
        save: vi.fn().mockResolvedValue(true),
      };
      Proposal.findById.mockResolvedValue(mockProposal);

      await proposalService.submitProposal('p1', 'u1');
      expect(mockProposal.status).toBe('review');
      expect(mockProposal.save).toHaveBeenCalled();
    });

    it('should throw error if not author', async () => {
      const mockProposal = { _id: 'p1', created_by: 'u1', status: 'draft' };
      Proposal.findById.mockResolvedValue(mockProposal);

      await expect(proposalService.submitProposal('p1', 'u2')).rejects.toThrow(
        'Not authorized',
      );
    });
  });
});
