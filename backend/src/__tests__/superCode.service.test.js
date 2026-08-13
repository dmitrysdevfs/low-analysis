import { describe, it, expect, beforeEach, vi } from 'vitest';
import AdminConfig from '../models/AdminConfig.js';
import { appendAuditEntry } from '../services/admin/audit.service.js';
import {
  getActiveCode,
  rotateCode,
} from '../services/admin/superCode.service.js';

vi.mock('../models/AdminConfig.js', () => ({
  default: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn().mockResolvedValue({}),
  },
}));
vi.mock('../services/admin/audit.service.js', () => ({
  appendAuditEntry: vi.fn().mockResolvedValue({}),
}));

const CODE_PATTERN = /^LOW-(?:[0-9A-HJKMNP-TV-Z]{6}-){4}[0-9A-HJKMNP-TV-Z]{6}$/;

const mockHistory = (value) => {
  AdminConfig.findOne.mockReturnValue({
    lean: vi.fn().mockResolvedValue(value ? { value } : null),
  });
};

describe('superCode.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AdminConfig.findOneAndUpdate.mockResolvedValue({});
    mockHistory(null);
  });

  it('returns null instead of a fallback when no code is configured', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockHistory(null);

    await expect(getActiveCode()).resolves.toBeNull();
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('generates a code in the expected format', async () => {
    const { code } = await rotateCode('admin@example.com');

    expect(code).toMatch(CODE_PATTERN);
  });

  it('does not repeat itself across rotations', async () => {
    const codes = new Set();
    for (let i = 0; i < 50; i += 1) {
      const { code } = await rotateCode('admin@example.com');
      codes.add(code);
    }

    expect(codes.size).toBe(50);
  });

  it('keeps the code out of the audit entry', async () => {
    const { code } = await rotateCode('admin@example.com');

    const entry = appendAuditEntry.mock.calls[0][0];
    expect(JSON.stringify(entry)).not.toContain(code);
  });

  it('keeps the code out of the stored history', async () => {
    const { code } = await rotateCode('admin@example.com');

    const historyWrite = AdminConfig.findOneAndUpdate.mock.calls.find(
      ([filter]) => filter.key === 'adminSuperCodeHistory',
    );
    expect(JSON.stringify(historyWrite[1].value)).not.toContain(code);
  });

  it('strips codes left in history by earlier versions', async () => {
    mockHistory([
      {
        id: 'sc-1',
        code: 'LOW-LEGACY-VALUE',
        rotatedAt: '2026-01-01T00:00:00.000Z',
        rotatedBy: 'admin@example.com',
        status: 'active',
      },
    ]);

    await rotateCode('admin@example.com');

    const historyWrite = AdminConfig.findOneAndUpdate.mock.calls.find(
      ([filter]) => filter.key === 'adminSuperCodeHistory',
    );
    expect(JSON.stringify(historyWrite[1].value)).not.toContain(
      'LOW-LEGACY-VALUE',
    );
  });
});
