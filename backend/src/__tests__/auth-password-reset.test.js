import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';

vi.mock('../models/User.js');
vi.mock('../modules/email/email.service.js', () => ({
  sendTransactionalEmail: vi.fn().mockResolvedValue({ messageId: 'mock-id' }),
  sendBulkEmails: vi.fn().mockResolvedValue([]),
}));
vi.mock('../services/admin/superCode.service.js', () => ({
  getActiveCode: vi.fn().mockResolvedValue('LOW-TEST-CODE'),
}));

import { sendTransactionalEmail } from '../modules/email/email.service.js';

describe('Password Reset Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── POST /api/auth/forgot-password ─────────────────────────────
  describe('POST /api/auth/forgot-password', () => {
    it('returns 400 if email is missing', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/email/i);
    });

    it('returns 200 even when user does not exist (security: no email enumeration)', async () => {
      User.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nobody@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/reset link/i);
      expect(sendTransactionalEmail).not.toHaveBeenCalled();
    });

    it('sends reset email and returns 200 when user exists', async () => {
      const mockUser = {
        _id: 'user-id-1',
        email: 'test@example.com',
        fullName: 'Test User',
        resetPasswordToken: null,
        resetPasswordExpiry: null,
        save: vi.fn().mockResolvedValue(true),
      };
      User.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      });

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/reset link/i);
      expect(mockUser.save).toHaveBeenCalled();
      expect(sendTransactionalEmail).toHaveBeenCalledOnce();

      const callArgs = sendTransactionalEmail.mock.calls[0][0];
      expect(callArgs.to[0].email).toBe('test@example.com');
      expect(callArgs.subject).toMatch(/парол/i);
      expect(callArgs.htmlContent).toContain(
        'http://localhost:3001/auth/reset-password',
      );
    });

    it('stores hashed token (not raw) on the user', async () => {
      const mockUser = {
        _id: 'user-id-1',
        email: 'test@example.com',
        fullName: 'Test User',
        resetPasswordToken: null,
        resetPasswordExpiry: null,
        save: vi.fn().mockResolvedValue(true),
      };
      User.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      });

      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      // Token stored on user must be a hex string (sha256 hash, 64 chars)
      expect(mockUser.resetPasswordToken).toMatch(/^[a-f0-9]{64}$/);
      // The raw token sent in email URL must differ from stored hash
      const emailHtml = sendTransactionalEmail.mock.calls[0][0].htmlContent;
      const urlMatch = emailHtml.match(/reset-password\?token=([a-f0-9]+)/);
      expect(urlMatch).not.toBeNull();
      expect(urlMatch[1]).not.toBe(mockUser.resetPasswordToken);
    });

    it('clears token and returns 200 if email service throws (prevents email enumeration)', async () => {
      const mockUser = {
        _id: 'user-id-1',
        email: 'test@example.com',
        fullName: 'Test User',
        resetPasswordToken: null,
        resetPasswordExpiry: null,
        save: vi.fn().mockResolvedValue(true),
      };
      User.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      });
      sendTransactionalEmail.mockRejectedValueOnce(new Error('SMTP error'));

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/reset link/i);
      // Token must be cleared on failure
      expect(mockUser.resetPasswordToken).toBeUndefined();
      expect(mockUser.resetPasswordExpiry).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalledTimes(2); // once to set, once to clear
    });
  });

  // ── POST /api/auth/reset-password ──────────────────────────────
  describe('POST /api/auth/reset-password', () => {
    it('returns 400 if token or password is missing', async () => {
      const noToken = await request(app)
        .post('/api/auth/reset-password')
        .send({ password: 'newpass123' });
      expect(noToken.status).toBe(400);

      const noPassword = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'sometoken' });
      expect(noPassword.status).toBe(400);
    });

    it('returns 400 if new password is too short', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'sometoken', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/8 characters/i);
    });

    it('returns 400 for invalid or expired token', async () => {
      User.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'invalidtoken', password: 'newpassword123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid or expired/i);
    });

    it('resets password and clears token on success', async () => {
      const mockUser = {
        _id: 'user-id-1',
        email: 'test@example.com',
        password: 'oldhashedpassword',
        resetPasswordToken: 'hashedtoken',
        resetPasswordExpiry: new Date(Date.now() + 3600000),
        save: vi.fn().mockResolvedValue(true),
      };
      User.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      });

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'validrawtoken', password: 'newpassword123' });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/reset successfully/i);
      expect(mockUser.password).toBe('newpassword123');
      expect(mockUser.resetPasswordToken).toBeUndefined();
      expect(mockUser.resetPasswordExpiry).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
    });
  });
});
