import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as supervisorService from '../services/supervisor.service.js';
import Group from '../models/Group.js';
import Proposal from '../models/Proposal.js';
import LawFork from '../models/LawFork.js';

vi.mock('../models/Group.js');
vi.mock('../models/Proposal.js');
vi.mock('../models/LawFork.js');

describe('supervisorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createGroup', () => {
    it('should create a group and normalize it', async () => {
      const mockGroup = {
        _id: 'g1',
        name: 'Test Group',
        course: 'Test Course',
        supervisorId: 's1',
        members: [{ userId: 'u1', status: 'active', joinedAt: new Date() }],
        trackedLaws: ['l1'],
        status: 'active',
      };
      Group.create.mockResolvedValue(mockGroup);

      const result = await supervisorService.createGroup('s1', {
        name: 'Test Group',
        course: 'Test Course',
        memberIds: ['u1'],
        trackedLawIds: ['l1'],
      });

      expect(Group.create).toHaveBeenCalled();
      expect(result._id).toBe('g1');
      expect(result.memberIds).toEqual(['u1']);
      expect(result.trackedLawIds).toEqual([
        { _id: 'l1', title: '', code: '' },
      ]);
    });
  });

  describe('updateGroup', () => {
    it('should update group and return normalized result', async () => {
      const save = vi.fn().mockResolvedValue({
        _id: 'g1',
        name: 'Updated Group',
        course: 'Updated Course',
        supervisorId: 's1',
        members: [{ userId: 'u2', status: 'active' }],
        trackedLaws: ['l2'],
        status: 'active',
      });
      const mockGroup = {
        _id: 'g1',
        name: 'Test Group',
        save,
      };
      Group.findOne.mockResolvedValue(mockGroup);

      const result = await supervisorService.updateGroup('g1', 's1', {
        name: 'Updated Group',
        course: 'Updated Course',
        memberIds: ['u2'],
        trackedLawIds: ['l2'],
      });

      expect(Group.findOne).toHaveBeenCalledWith({
        _id: 'g1',
        supervisorId: 's1',
      });
      expect(save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Group');
      expect(result.memberIds).toEqual(['u2']);
      expect(result.trackedLawIds).toEqual([
        { _id: 'l2', title: '', code: '' },
      ]);
    });

    it('should throw error if group not found', async () => {
      Group.findOne.mockResolvedValue(null);
      await expect(
        supervisorService.updateGroup('g1', 's1', { name: 'Updated' }),
      ).rejects.toThrow('Group not found');
    });
  });

  describe('getDashboardSummary', () => {
    it('should load groups, activity items, and build dashboard summary', async () => {
      const mockGroups = [
        {
          _id: 'g1',
          name: 'Group 1',
          course: 'Course 1',
          supervisorId: 's1',
          members: [
            {
              userId: { _id: 'u1', fullName: 'User 1', email: 'u1@test.com' },
              status: 'active',
            },
          ],
          trackedLaws: [{ _id: 'l1', title: 'Law 1', code: 'L1' }],
          status: 'active',
        },
      ];

      const mockFindChain = {
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockGroups),
      };
      Group.find.mockReturnValue(mockFindChain);

      const mockForks = [
        {
          _id: 'f1',
          lawId: { _id: 'l1', title: 'Law 1', code: 'L1' },
          authorId: { _id: 'u1', fullName: 'User 1', email: 'u1@test.com' },
          title: 'My Fork',
          status: 'review',
          updatedAt: new Date(Date.now() - 10000),
        },
      ];
      const mockForkChain = {
        select: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockForks),
      };
      LawFork.find.mockReturnValue(mockForkChain);

      const mockProposals = [
        {
          _id: 'p1',
          law_id: { _id: 'l1', title: 'Law 1', code: 'L1' },
          created_by: { _id: 'u1', fullName: 'User 1', email: 'u1@test.com' },
          title: 'My Proposal',
          status: 'review',
          updatedAt: new Date(),
        },
      ];
      const mockProposalChain = {
        select: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockProposals),
      };
      Proposal.find.mockReturnValue(mockProposalChain);

      const summary = await supervisorService.getDashboardSummary('s1');

      expect(Group.find).toHaveBeenCalledWith({
        supervisorId: 's1',
        status: 'active',
      });
      expect(LawFork.find).toHaveBeenCalled();
      expect(Proposal.find).toHaveBeenCalled();

      expect(summary.totalMembers).toBe(1);
      expect(summary.totalTrackedLaws).toBe(1);
      expect(summary.statusBreakdown.totalChanges).toBe(2);
      expect(summary.statusBreakdown.reviewCount).toBe(2); // both fork and proposal are in 'review' status

      expect(summary.groupHighlights[0].changeCount).toBe(2);
      expect(summary.recentActivity).toHaveLength(2);
      expect(summary.recentActivity[0].title).toBe('My Proposal');
      expect(summary.recentActivity[1].title).toBe('My Fork');
    });

    it('should work with empty tracked laws list and dynamically track edited laws', async () => {
      const mockGroups = [
        {
          _id: 'g2',
          name: 'Group 2',
          course: 'Course 2',
          supervisorId: 's1',
          members: [
            {
              userId: { _id: 'u2', fullName: 'User 2', email: 'u2@test.com' },
              status: 'active',
            },
          ],
          trackedLaws: [], // Empty tracked laws list
          status: 'active',
        },
      ];

      const mockFindChain = {
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockGroups),
      };
      Group.find.mockReturnValue(mockFindChain);

      const mockForks = [
        {
          _id: 'f2',
          lawId: { _id: 'l2', title: 'Law 2', code: 'L2' },
          authorId: { _id: 'u2', fullName: 'User 2', email: 'u2@test.com' },
          title: 'User 2 Fork',
          status: 'review',
          updatedAt: new Date(Date.now() - 10000),
        },
      ];
      const mockForkChain = {
        select: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockForks),
      };
      LawFork.find.mockReturnValue(mockForkChain);

      const mockProposals = [
        {
          _id: 'p2',
          law_id: { _id: 'l2', title: 'Law 2', code: 'L2' },
          created_by: { _id: 'u2', fullName: 'User 2', email: 'u2@test.com' },
          title: 'User 2 Proposal',
          status: 'review',
          updatedAt: new Date(),
        },
      ];
      const mockProposalChain = {
        select: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockProposals),
      };
      Proposal.find.mockReturnValue(mockProposalChain);

      const summary = await supervisorService.getDashboardSummary('s1');

      expect(Group.find).toHaveBeenCalledWith({
        supervisorId: 's1',
        status: 'active',
      });
      // The find calls should not contain lawIds filters when they are empty
      expect(LawFork.find).toHaveBeenCalledWith({
        authorId: { $in: ['u2'] },
      });
      expect(Proposal.find).toHaveBeenCalledWith({
        created_by: { $in: ['u2'] },
      });

      expect(summary.totalMembers).toBe(1);
      expect(summary.totalTrackedLaws).toBe(1); // dynamically found Law 2
      expect(summary.statusBreakdown.totalChanges).toBe(2);
      expect(summary.statusBreakdown.reviewCount).toBe(2);

      expect(summary.groupHighlights[0].changeCount).toBe(2);
      expect(summary.groupHighlights[0].trackedLawsCount).toBe(1); // dynamically tracked Law 2
      expect(summary.recentActivity).toHaveLength(2);
      expect(summary.recentActivity[0].title).toBe('User 2 Proposal');
      expect(summary.recentActivity[1].title).toBe('User 2 Fork');
    });
  });
});
