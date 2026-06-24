import { describe, it, expect } from 'vitest';
import {
  calculateVoteWeight,
  checkApprovalThreshold,
  shouldCheckDeadline,
} from '../voteThreshold.service.js';

describe('calculateVoteWeight', () => {
  it('returns 0 for admin', () => {
    expect(calculateVoteWeight('admin')).toBe(0);
  });

  it('returns 1 for user', () => {
    expect(calculateVoteWeight('user')).toBe(1);
  });

  it('returns 1 for paid_user', () => {
    expect(calculateVoteWeight('paid_user')).toBe(1);
  });

  it('returns 5 for supervisor', () => {
    expect(calculateVoteWeight('supervisor')).toBe(5);
  });

  it('returns 3 for legislator', () => {
    expect(calculateVoteWeight('legislator')).toBe(3);
  });

  it('returns 1 for unknown role (default)', () => {
    expect(calculateVoteWeight('superuser')).toBe(1);
    expect(calculateVoteWeight(undefined)).toBe(1);
    expect(calculateVoteWeight('')).toBe(1);
  });
});

describe('checkApprovalThreshold', () => {
  it('returns true when votes_for >= 10 and for > against (no deadline)', () => {
    expect(
      checkApprovalThreshold({
        votes_for_weighted: 10,
        votes_against_weighted: 5,
        voting_deadline: null,
      }),
    ).toBe(true);
  });

  it('returns false when votes_for < 10 and no deadline passed', () => {
    expect(
      checkApprovalThreshold({
        votes_for_weighted: 9,
        votes_against_weighted: 5,
        voting_deadline: null,
      }),
    ).toBe(false);
  });

  it('returns true when deadline passed and for > against (votes_for < 10)', () => {
    const pastDeadline = new Date(Date.now() - 1000);
    expect(
      checkApprovalThreshold({
        votes_for_weighted: 5,
        votes_against_weighted: 3,
        voting_deadline: pastDeadline,
      }),
    ).toBe(true);
  });

  it('returns false when deadline passed but against >= for', () => {
    const pastDeadline = new Date(Date.now() - 1000);
    expect(
      checkApprovalThreshold({
        votes_for_weighted: 5,
        votes_against_weighted: 7,
        voting_deadline: pastDeadline,
      }),
    ).toBe(false);
  });

  it('returns false when deadline is in the future and votes_for < 10', () => {
    const futureDeadline = new Date(Date.now() + 86400_000);
    expect(
      checkApprovalThreshold({
        votes_for_weighted: 5,
        votes_against_weighted: 3,
        voting_deadline: futureDeadline,
      }),
    ).toBe(false);
  });

  it('returns false when against > for even with votes_for >= 10', () => {
    expect(
      checkApprovalThreshold({
        votes_for_weighted: 10,
        votes_against_weighted: 11,
        voting_deadline: null,
      }),
    ).toBe(false);
  });
});

describe('shouldCheckDeadline', () => {
  it('returns true when deadline is past and status is active', () => {
    const pastDeadline = new Date(Date.now() - 1000);
    expect(
      shouldCheckDeadline({ voting_deadline: pastDeadline, status: 'active' }),
    ).toBe(true);
  });

  it('returns false when deadline is in the future', () => {
    const futureDeadline = new Date(Date.now() + 86400_000);
    expect(
      shouldCheckDeadline({
        voting_deadline: futureDeadline,
        status: 'active',
      }),
    ).toBe(false);
  });

  it('returns false when deadline is past but status is not active', () => {
    const pastDeadline = new Date(Date.now() - 1000);
    expect(
      shouldCheckDeadline({
        voting_deadline: pastDeadline,
        status: 'approved',
      }),
    ).toBe(false);
  });

  it('returns false when no deadline', () => {
    expect(
      shouldCheckDeadline({ voting_deadline: null, status: 'active' }),
    ).toBe(false);
    expect(
      shouldCheckDeadline({ voting_deadline: undefined, status: 'active' }),
    ).toBe(false);
  });
});
