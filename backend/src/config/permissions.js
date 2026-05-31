export const ROLE_PERMISSIONS = {
  user: ['laws:read', 'comments:read'],
  paid_user: ['laws:read', 'comments:read', 'comments:create'],
  legislator: [
    'laws:read',
    'amendments:create', 'amendments:edit', 'amendments:delete',
    'proposals:create', 'proposals:submit',
    'comments:create', 'comments:read',
    'votes:cast',
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
