export const ROLE_PERMISSIONS = {
  user: ['laws:read', 'comments:read', 'law_changes:read', 'law_changes:vote', 'graph_proposals:vote', 'radiant_proposals:vote'],
  paid_user: [
    'laws:read',
    'comments:read',
    'comments:create',
    'law_changes:read',
    'law_changes:vote',
    'graph_proposals:vote',
    'radiant_proposals:vote',
  ],
  legislator: [
    'laws:read',
    'amendments:create',
    'amendments:edit',
    'amendments:delete',
    'proposals:create',
    'proposals:submit',
    'proposals:delete',
    'comments:create',
    'comments:read',
    'votes:cast',
    'law_changes:read',
    'law_changes:vote',
    'law_changes:propose',
    'graph_proposals:create',
    'graph_proposals:vote',
    'radiant_proposals:create',
    'radiant_proposals:vote',
  ],
  supervisor: [
    'laws:read',
    'proposals:read',
    'forks:read',
    'groups:manage',
    'activity:read',
    'comments:read',
    'law_changes:read',
    'law_changes:vote',
    'law_changes:propose',
    'graph_proposals:create',
    'graph_proposals:vote',
    'radiant_proposals:create',
    'radiant_proposals:vote',
  ],
  admin: ['*'],
};

/**
 * Check if a role has a specific permission.
 * @param {string} role
 * @param {string} permission
 * @returns {boolean}
 */
export function roleHasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes('*') || perms.includes(permission);
}
