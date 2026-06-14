import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as proposalService from '../services/proposalService.js';
import Proposal from '../models/Proposal.js';
import Amendment from '../models/Amendment.js';

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

  describe('deleteProposal', () => {
    it('should delete a draft proposal and cascade-delete its amendments', async () => {
      const deleteOne = vi.fn().mockResolvedValue(true);
      const mockProposal = {
        _id: 'p1',
        created_by: 'u1',
        status: 'draft',
        deleteOne,
      };
      Proposal.findById.mockResolvedValue(mockProposal);
      Amendment.deleteMany.mockResolvedValue({ deletedCount: 2 });

      await proposalService.deleteProposal('p1', 'u1');

      expect(Amendment.deleteMany).toHaveBeenCalledWith({ proposal_id: 'p1' });
      expect(deleteOne).toHaveBeenCalled();
    });

    it('should throw 404 if proposal not found', async () => {
      Proposal.findById.mockResolvedValue(null);

      await expect(
        proposalService.deleteProposal('missing', 'u1'),
      ).rejects.toMatchObject({
        message: 'Proposal not found',
        statusCode: 404,
      });
      expect(Amendment.deleteMany).not.toHaveBeenCalled();
    });

    it('should throw 403 if not author', async () => {
      const mockProposal = {
        _id: 'p1',
        created_by: 'u1',
        status: 'draft',
        deleteOne: vi.fn(),
      };
      Proposal.findById.mockResolvedValue(mockProposal);

      await expect(
        proposalService.deleteProposal('p1', 'u2'),
      ).rejects.toMatchObject({ statusCode: 403 });
      expect(Amendment.deleteMany).not.toHaveBeenCalled();
      expect(mockProposal.deleteOne).not.toHaveBeenCalled();
    });

    it('should throw 400 if proposal is not draft', async () => {
      const mockProposal = {
        _id: 'p1',
        created_by: 'u1',
        status: 'review',
        deleteOne: vi.fn(),
      };
      Proposal.findById.mockResolvedValue(mockProposal);

      await expect(
        proposalService.deleteProposal('p1', 'u1'),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(Amendment.deleteMany).not.toHaveBeenCalled();
      expect(mockProposal.deleteOne).not.toHaveBeenCalled();
    });
  });
});
