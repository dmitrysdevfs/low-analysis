import { describe, it, expect } from 'vitest';
import { roleHasPermission } from '../config/permissions.js';

describe('Permissions', () => {
  it('should return true for admin with any permission', () => {
    expect(roleHasPermission('admin', 'any:thing')).toBe(true);
    expect(roleHasPermission('admin', '*')).toBe(true);
  });

  it('should return correct permissions for user', () => {
    expect(roleHasPermission('user', 'laws:read')).toBe(true);
    expect(roleHasPermission('user', 'amendments:create')).toBe(false);
  });

  it('should return correct permissions for legislator', () => {
    expect(roleHasPermission('legislator', 'amendments:create')).toBe(true);
    expect(roleHasPermission('legislator', 'proposals:submit')).toBe(true);
    expect(roleHasPermission('legislator', 'other:thing')).toBe(false);
  });

  it('should return false for unknown role', () => {
    expect(roleHasPermission('hacker', 'laws:read')).toBe(false);
  });
});
