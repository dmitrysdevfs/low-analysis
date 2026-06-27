import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../models/LawChangeVote.js', () => ({
  default: {
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
  },
}));

vi.mock('../../../models/LawChangeProposal.js', () => ({
  default: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock('../../../models/ApprovedChange.js', () => ({
  default: {
    updateMany: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../voteThreshold.service.js', () => ({
  calculateVoteWeight: vi.fn(() => 3),
  checkApprovalThreshold: vi.fn(() => false),
}));

import LawChangeVote from '../../../models/LawChangeVote.js';
import LawChangeProposal from '../../../models/LawChangeProposal.js';
import ApprovedChange from '../../../models/ApprovedChange.js';
import { calculateVoteWeight, checkApprovalThreshold } from '../voteThreshold.service.js';
import { castVote, removeVote, getVoteStats } from '../vote.service.js';

const PROPOSAL_ID = 'prop-111';
const USER_ID = 'user-222';
const AUTHOR_ID = 'author-333';

function makeProposal(overrides = {}) {
  return {
    _id: PROPOSAL_ID,
    created_by: AUTHOR_ID,
    status: 'active',
    element_id: 'elem-1',
    law_id: 'law-1',
    change_type: 'edit',
    proposed_text: 'New text',
    votes_for_weighted: 0,
    votes_against_weighted: 0,
    votes_for_count: 0,
    votes_against_count: 0,
    voting_deadline: null,
    save: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  LawChangeVote.find.mockResolvedValue([]);
  LawChangeVote.findOneAndUpdate.mockResolvedValue({ vote: 'for', vote_weight: 3 });
  LawChangeVote.findOneAndDelete.mockResolvedValue({});
  LawChangeProposal.findByIdAndUpdate.mockResolvedValue(makeProposal());
  ApprovedChange.updateMany.mockResolvedValue({});
  ApprovedChange.create.mockResolvedValue({ _id: 'ac-1' });
});

describe('castVote', () => {
  it('throws 403 when user is admin', async () => {
    await expect(
      castVote(PROPOSAL_ID, { _id: USER_ID, role: 'admin' }, 'for'),
    ).rejects.toMatchObject({ status: 403, message: 'Admins cannot vote' });
  });

  it('throws 404 when proposal not found', async () => {
    LawChangeProposal.findById.mockResolvedValue(null);

    await expect(
      castVote(PROPOSAL_ID, { _id: USER_ID, role: 'legislator' }, 'for'),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('throws 403 when user votes on own proposal', async () => {
    LawChangeProposal.findById.mockResolvedValue(makeProposal({ created_by: USER_ID }));

    await expect(
      castVote(PROPOSAL_ID, { _id: USER_ID, role: 'legislator' }, 'for'),
    ).rejects.toMatchObject({ status: 403, message: 'Cannot vote on your own proposal' });
  });

  it('throws 400 when proposal is not active', async () => {
    LawChangeProposal.findById.mockResolvedValue(makeProposal({ status: 'draft' }));

    await expect(
      castVote(PROPOSAL_ID, { _id: USER_ID, role: 'legislator' }, 'for'),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('upserts vote and recalculates totals', async () => {
    LawChangeProposal.findById
      .mockResolvedValueOnce(makeProposal())
      .mockResolvedValue(makeProposal({ votes_for_weighted: 3, votes_for_count: 1 }));
    calculateVoteWeight.mockReturnValue(3);
    checkApprovalThreshold.mockReturnValue(false);

    await castVote(PROPOSAL_ID, { _id: USER_ID, role: 'legislator' }, 'for');

    expect(LawChangeVote.findOneAndUpdate).toHaveBeenCalledWith(
      { proposal_id: PROPOSAL_ID, user_id: USER_ID },
      { vote: 'for', vote_weight: 3 },
      expect.objectContaining({ upsert: true }),
    );
    expect(LawChangeProposal.findByIdAndUpdate).toHaveBeenCalled();
  });

  it('creates ApprovedChange when approval threshold is met', async () => {
    const approvedProposal = makeProposal({
      votes_for_weighted: 12,
      votes_for_count: 3,
    });
    LawChangeProposal.findById
      .mockResolvedValueOnce(makeProposal())
      .mockResolvedValue(approvedProposal);
    LawChangeProposal.findByIdAndUpdate.mockResolvedValue(approvedProposal);
    checkApprovalThreshold.mockReturnValue(true);

    await castVote(PROPOSAL_ID, { _id: USER_ID, role: 'supervisor' }, 'for');

    expect(ApprovedChange.updateMany).toHaveBeenCalledWith(
      { element_id: 'elem-1', is_current: true },
      { is_current: false },
    );
    expect(ApprovedChange.create).toHaveBeenCalledWith(
      expect.objectContaining({
        law_id: 'law-1',
        element_id: 'elem-1',
        winning_proposal_id: PROPOSAL_ID,
        is_current: true,
        status: 'active',
      }),
    );
  });

  it('does NOT create ApprovedChange when threshold is not met', async () => {
    LawChangeProposal.findById
      .mockResolvedValueOnce(makeProposal())
      .mockResolvedValue(makeProposal());
    checkApprovalThreshold.mockReturnValue(false);

    await castVote(PROPOSAL_ID, { _id: USER_ID, role: 'legislator' }, 'for');

    expect(ApprovedChange.create).not.toHaveBeenCalled();
  });
});

describe('removeVote', () => {
  it('throws 404 when proposal not found', async () => {
    LawChangeProposal.findById.mockResolvedValue(null);

    await expect(removeVote(PROPOSAL_ID, USER_ID)).rejects.toMatchObject({ status: 404 });
  });

  it('throws 400 when proposal is not active', async () => {
    LawChangeProposal.findById.mockResolvedValue(makeProposal({ status: 'approved' }));

    await expect(removeVote(PROPOSAL_ID, USER_ID)).rejects.toMatchObject({ status: 400 });
  });

  it('deletes vote and recalculates totals', async () => {
    LawChangeProposal.findById.mockResolvedValue(makeProposal());
    LawChangeProposal.findByIdAndUpdate.mockResolvedValue(makeProposal());

    await removeVote(PROPOSAL_ID, USER_ID);

    expect(LawChangeVote.findOneAndDelete).toHaveBeenCalledWith({
      proposal_id: PROPOSAL_ID,
      user_id: USER_ID,
    });
    expect(LawChangeProposal.findByIdAndUpdate).toHaveBeenCalled();
  });
});

describe('getVoteStats', () => {
  it('throws 404 when proposal not found', async () => {
    LawChangeProposal.findById.mockReturnValue({ lean: () => Promise.resolve(null) });

    await expect(getVoteStats(PROPOSAL_ID, USER_ID)).rejects.toMatchObject({ status: 404 });
  });

  it('returns vote stats with my_vote null when not authenticated', async () => {
    LawChangeProposal.findById.mockReturnValue({
      lean: () =>
        Promise.resolve(
          makeProposal({ votes_for_weighted: 5, votes_against_weighted: 2 }),
        ),
    });

    const result = await getVoteStats(PROPOSAL_ID, null);

    expect(result.votes_for_weighted).toBe(5);
    expect(result.votes_against_weighted).toBe(2);
    expect(result.my_vote).toBeNull();
    expect(LawChangeVote.findOne).not.toHaveBeenCalled();
  });

  it('returns my_vote when user has voted', async () => {
    LawChangeProposal.findById.mockReturnValue({
      lean: () => Promise.resolve(makeProposal()),
    });
    LawChangeVote.findOne.mockReturnValue({ lean: () => Promise.resolve({ vote: 'for' }) });

    const result = await getVoteStats(PROPOSAL_ID, USER_ID);

    expect(result.my_vote).toBe('for');
  });
});
