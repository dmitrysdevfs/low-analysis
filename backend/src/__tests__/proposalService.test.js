import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as proposalService from '../services/proposalService.js';
import Proposal from '../models/Proposal.js';
import Amendment from '../models/Amendment.js';

const mockSession = {
  startTransaction: vi.fn(),
  commitTransaction: vi.fn(),
  abortTransaction: vi.fn(),
  endSession: vi.fn(),
};

vi.mock('mongoose', async () => {
  const actual = await vi.importActual('mongoose');
  return {
    ...actual,
    default: {
      ...actual.default,
      startSession: vi
        .fn()
        .mockImplementation(() => Promise.resolve(mockSession)),
    },
    startSession: vi
      .fn()
      .mockImplementation(() => Promise.resolve(mockSession)),
  };
});

vi.mock('../models/Proposal.js');
vi.mock('../models/Amendment.js');
vi.mock('../models/Law.js');
vi.mock('../services/amendmentService.js', () => ({ reviewAmendment: vi.fn() }));

describe('proposalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.startTransaction.mockClear();
    mockSession.commitTransaction.mockClear();
    mockSession.abortTransaction.mockClear();
    mockSession.endSession.mockClear();
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
    it('should delete a draft proposal and cascade-delete its amendments with transaction', async () => {
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

      expect(Amendment.deleteMany).toHaveBeenCalledWith(
        { proposal_id: 'p1' },
        { session: mockSession },
      );
      expect(deleteOne).toHaveBeenCalledWith({ session: mockSession });
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(mockSession.abortTransaction).not.toHaveBeenCalled();
    });

    it('should abort transaction and throw error if deletion fails', async () => {
      const deleteOne = vi.fn().mockRejectedValue(new Error('DB error'));
      const mockProposal = {
        _id: 'p1',
        created_by: 'u1',
        status: 'draft',
        deleteOne,
      };
      Proposal.findById.mockResolvedValue(mockProposal);
      Amendment.deleteMany.mockResolvedValue({ deletedCount: 2 });

      await expect(proposalService.deleteProposal('p1', 'u1')).rejects.toThrow(
        'DB error',
      );

      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).not.toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
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

  describe('reviewProposal', () => {
    it('should throw 404 if proposal not found', async () => {
      Proposal.findById.mockResolvedValue(null);

      await expect(
        proposalService.reviewProposal('missing', 'approve'),
      ).rejects.toMatchObject({ statusCode: 404, message: 'Proposal not found' });
    });

    it('should throw 400 if proposal status is not review', async () => {
      Proposal.findById.mockResolvedValue({ _id: 'p1', status: 'draft', save: vi.fn() });

      await expect(
        proposalService.reviewProposal('p1', 'approve'),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should set status to approved when action is approve', async () => {
      const mockProposal = {
        _id: 'p1',
        status: 'review',
        save: vi.fn().mockResolvedValue(true),
      };
      Proposal.findById.mockResolvedValue(mockProposal);

      await proposalService.reviewProposal('p1', 'approve');

      expect(mockProposal.status).toBe('approved');
      expect(mockProposal.save).toHaveBeenCalled();
    });

    it('should set status to rejected when action is reject', async () => {
      const mockProposal = {
        _id: 'p1',
        status: 'review',
        save: vi.fn().mockResolvedValue(true),
      };
      Proposal.findById.mockResolvedValue(mockProposal);

      await proposalService.reviewProposal('p1', 'reject');

      expect(mockProposal.status).toBe('rejected');
      expect(mockProposal.save).toHaveBeenCalled();
    });
  });
});
