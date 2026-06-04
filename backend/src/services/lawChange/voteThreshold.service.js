/**
 * Pure vote threshold logic — no Mongoose dependencies.
 */

/**
 * Returns vote weight for a given role.
 * @param {string} role
 * @returns {number} 0 | 1 | 3
 */
export function calculateVoteWeight(role) {
  if (role === 'legislator') return 3;
  if (role === 'admin') return 0;
  return 1; // user, paid_user
}

/**
 * Checks whether an approval threshold is met.
 * Threshold: votes_for_weighted >= 10 AND votes_for_weighted > votes_against_weighted
 *            OR (deadline passed AND votes_for_weighted > votes_against_weighted)
 * @param {{ votes_for_weighted: number, votes_against_weighted: number, voting_deadline: Date|null }} proposal
 * @returns {boolean}
 */
export function checkApprovalThreshold(proposal) {
  const { votes_for_weighted, votes_against_weighted, voting_deadline } =
    proposal;

  const forWins = votes_for_weighted > votes_against_weighted;

  if (votes_for_weighted >= 10 && forWins) return true;

  if (voting_deadline && new Date() > new Date(voting_deadline) && forWins) {
    return true;
  }

  return false;
}

/**
 * Returns true if the deadline has passed and proposal is still active.
 * @param {{ voting_deadline: Date|null, status: string }} proposal
 * @returns {boolean}
 */
export function shouldCheckDeadline(proposal) {
  if (!proposal.voting_deadline) return false;
  if (proposal.status !== 'active') return false;
  return new Date() > new Date(proposal.voting_deadline);
}
