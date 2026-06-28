import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../models/LegislatorAccessRequest.js', () => ({
  default: {
    findOne: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock('../../../models/User.js', () => ({
  default: {
    findByIdAndUpdate: vi.fn(),
  },
}));

import LegislatorAccessRequest from '../../../models/LegislatorAccessRequest.js';
import User from '../../../models/User.js';
import { revokeRole } from '../legislatorRequest.service.js';

const USER_ID = 'user-abc-123';

function makeUser(role = 'user') {
  return { _id: USER_ID, email: 'test@test.dev', role };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('revokeRole (self-revoke)', () => {
  it('sets user role to "user"', async () => {
    User.findByIdAndUpdate.mockReturnValue({
      select: vi.fn().mockResolvedValue(makeUser('user')),
    });
    LegislatorAccessRequest.updateMany.mockResolvedValue({ modifiedCount: 1 });

    await revokeRole(USER_ID);

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      USER_ID,
      { role: 'user' },
      { new: true },
    );
  });

  it('revokes all approved access requests for the user', async () => {
    User.findByIdAndUpdate.mockReturnValue({
      select: vi.fn().mockResolvedValue(makeUser('user')),
    });
    LegislatorAccessRequest.updateMany.mockResolvedValue({ modifiedCount: 1 });

    await revokeRole(USER_ID);

    expect(LegislatorAccessRequest.updateMany).toHaveBeenCalledWith(
      { userId: USER_ID, status: 'approved' },
      { status: 'revoked' },
    );
  });

  it('throws 404 when user not found', async () => {
    User.findByIdAndUpdate.mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    });

    await expect(revokeRole(USER_ID)).rejects.toMatchObject({ status: 404 });
    expect(LegislatorAccessRequest.updateMany).not.toHaveBeenCalled();
  });

  it('does not call updateMany when user lookup fails', async () => {
    User.findByIdAndUpdate.mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    });

    await expect(revokeRole(USER_ID)).rejects.toThrow();
    expect(LegislatorAccessRequest.updateMany).not.toHaveBeenCalled();
  });
});
