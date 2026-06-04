import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks must be declared before imports that use them (hoisted by vitest)
vi.mock('../../../models/LawChangeProposal.js', () => ({
  default: {
    create: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
  },
}));

vi.mock('../../../utils/id.js', () => ({
  compareIds: vi.fn(),
}));

import LawChangeProposal from '../../../models/LawChangeProposal.js';
import { compareIds } from '../../../utils/id.js';
import { submitProposal, withdrawProposal } from '../proposal.service.js';

const AUTHOR_ID = 'user-111';
const OTHER_ID = 'user-999';
const PROPOSAL_ID = 'prop-abc';

function makeSaveMock(fields) {
  const obj = { ...fields, save: vi.fn().mockResolvedValue({ ...fields }) };
  return obj;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('submitProposal', () => {
  it('throws 400 when proposal status is not draft', async () => {
    compareIds.mockReturnValue(true);
    LawChangeProposal.findById.mockResolvedValue(
      makeSaveMock({
        _id: PROPOSAL_ID,
        created_by: AUTHOR_ID,
        status: 'active',
        reason: 'some reason',
        element_id: null,
      }),
    );

    await expect(submitProposal(PROPOSAL_ID, AUTHOR_ID)).rejects.toMatchObject({
      status: 400,
      message: 'Only draft proposals can be submitted',
    });
  });

  it('throws 403 when user is not the author', async () => {
    compareIds.mockReturnValue(false);
    LawChangeProposal.findById.mockResolvedValue(
      makeSaveMock({
        _id: PROPOSAL_ID,
        created_by: AUTHOR_ID,
        status: 'draft',
        reason: 'reason',
        element_id: null,
      }),
    );

    await expect(submitProposal(PROPOSAL_ID, OTHER_ID)).rejects.toMatchObject({
      status: 403,
      message: 'Forbidden',
    });
  });

  it('throws 409 when another active proposal exists for the same element', async () => {
    compareIds.mockReturnValue(true);
    LawChangeProposal.findById.mockResolvedValue(
      makeSaveMock({
        _id: PROPOSAL_ID,
        created_by: AUTHOR_ID,
        status: 'draft',
        reason: 'reason',
        element_id: 'elem-1',
        law_id: 'law-1',
      }),
    );
    LawChangeProposal.findOne.mockResolvedValue({ _id: 'conflict-prop' });

    await expect(submitProposal(PROPOSAL_ID, AUTHOR_ID)).rejects.toMatchObject({
      status: 409,
      message: 'Another active proposal exists for this element',
    });
  });

  it('sets status to active and saves when all checks pass (no element_id)', async () => {
    compareIds.mockReturnValue(true);
    const proposal = makeSaveMock({
      _id: PROPOSAL_ID,
      created_by: AUTHOR_ID,
      status: 'draft',
      reason: 'reason',
      element_id: null,
    });
    LawChangeProposal.findById.mockResolvedValue(proposal);

    await submitProposal(PROPOSAL_ID, AUTHOR_ID);

    expect(proposal.status).toBe('active');
    expect(proposal.save).toHaveBeenCalledOnce();
  });
});

describe('withdrawProposal', () => {
  it('throws 403 when user is not the author', async () => {
    compareIds.mockReturnValue(false);
    LawChangeProposal.findById.mockResolvedValue(
      makeSaveMock({
        _id: PROPOSAL_ID,
        created_by: AUTHOR_ID,
        status: 'draft',
      }),
    );

    await expect(withdrawProposal(PROPOSAL_ID, OTHER_ID)).rejects.toMatchObject(
      {
        status: 403,
        message: 'Forbidden',
      },
    );
  });

  it('throws 400 when status is not draft or active', async () => {
    compareIds.mockReturnValue(true);
    LawChangeProposal.findById.mockResolvedValue(
      makeSaveMock({
        _id: PROPOSAL_ID,
        created_by: AUTHOR_ID,
        status: 'approved',
      }),
    );

    await expect(
      withdrawProposal(PROPOSAL_ID, AUTHOR_ID),
    ).rejects.toMatchObject({
      status: 400,
      message: 'Cannot withdraw in current status',
    });
  });

  it('sets status to withdrawn and saves when author withdraws draft', async () => {
    compareIds.mockReturnValue(true);
    const proposal = makeSaveMock({
      _id: PROPOSAL_ID,
      created_by: AUTHOR_ID,
      status: 'draft',
    });
    LawChangeProposal.findById.mockResolvedValue(proposal);

    await withdrawProposal(PROPOSAL_ID, AUTHOR_ID);

    expect(proposal.status).toBe('withdrawn');
    expect(proposal.save).toHaveBeenCalledOnce();
  });

  it('sets status to withdrawn when author withdraws active proposal', async () => {
    compareIds.mockReturnValue(true);
    const proposal = makeSaveMock({
      _id: PROPOSAL_ID,
      created_by: AUTHOR_ID,
      status: 'active',
    });
    LawChangeProposal.findById.mockResolvedValue(proposal);

    await withdrawProposal(PROPOSAL_ID, AUTHOR_ID);

    expect(proposal.status).toBe('withdrawn');
  });
});
