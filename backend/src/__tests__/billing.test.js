import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import BillingSubscription from '../models/BillingSubscription.js';
import BillingTransaction from '../models/BillingTransaction.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

vi.mock('../models/BillingSubscription.js');
vi.mock('../models/BillingTransaction.js');
vi.mock('../models/User.js');
vi.mock('../modules/email/email.service.js', () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
  sendWelcomeEmail: vi.fn().mockResolvedValue(true),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
}));

function makeToken(userId = 'user-abc') {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET);
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

function mockProtectUser(user) {
  User.findById = vi.fn().mockReturnValue({
    select: vi.fn().mockResolvedValue(user),
  });
}

describe('Billing API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET /api/billing/plans ──────────────────────────────────────
  describe('GET /api/billing/plans', () => {
    it('returns plan catalog without auth', async () => {
      const res = await request(app).get('/api/billing/plans');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(4);
      expect(res.body.map((p) => p.id)).toEqual([
        'trial',
        'user',
        'plus',
        'pro',
      ]);
    });
  });

  // ── GET /api/billing/me ─────────────────────────────────────────
  describe('GET /api/billing/me', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/billing/me');
      expect(res.status).toBe(401);
    });

    it('returns subscription and transactions for authenticated user', async () => {
      const userId = 'user-abc';
      const token = makeToken(userId);

      mockProtectUser({ _id: userId, role: 'user', status: 'active' });

      const mockSub = {
        userId,
        planId: 'user',
        status: 'active',
        usageSearch: 5,
        usageView: 2,
      };
      BillingSubscription.findOne = vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockSub),
      });
      BillingTransaction.find = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      });

      const res = await request(app)
        .get('/api/billing/me')
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('subscription');
      expect(res.body).toHaveProperty('transactions');
      expect(res.body.subscription.planId).toBe('user');
    });

    it('returns default inactive subscription when none exists', async () => {
      const userId = 'new-user';
      const token = makeToken(userId);

      mockProtectUser({ _id: userId, role: 'user', status: 'active' });
      BillingSubscription.findOne = vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });
      BillingTransaction.find = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      });

      const res = await request(app)
        .get('/api/billing/me')
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.subscription.status).toBe('inactive');
    });
  });

  // ── POST /api/billing/consume ───────────────────────────────────
  describe('POST /api/billing/consume', () => {
    it('returns 401 without token', async () => {
      const res = await request(app)
        .post('/api/billing/consume')
        .send({ type: 'search' });
      expect(res.status).toBe(401);
    });

    it('increments search usage', async () => {
      const userId = 'user-abc';
      const token = makeToken(userId);
      mockProtectUser({ _id: userId, role: 'user', status: 'active' });

      const mockSub = { usageSearch: 6, usageView: 2 };
      BillingSubscription.findOneAndUpdate = vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockSub),
      });

      const res = await request(app)
        .post('/api/billing/consume')
        .set(authHeader(token))
        .send({ type: 'search' });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.usage.search).toBe(6);
      expect(BillingSubscription.findOneAndUpdate).toHaveBeenCalledWith(
        { userId },
        { $inc: { usageSearch: 1 } },
        expect.objectContaining({ new: true, upsert: true }),
      );
    });

    it('rejects invalid type', async () => {
      const token = makeToken();
      mockProtectUser({ _id: 'user-abc', role: 'user', status: 'active' });

      const res = await request(app)
        .post('/api/billing/consume')
        .set(authHeader(token))
        .send({ type: 'invalid' });

      expect(res.status).toBe(400);
    });
  });

  // ── POST /api/billing/checkout/demo ────────────────────────────
  describe('POST /api/billing/checkout/demo', () => {
    it('returns 401 without token', async () => {
      const res = await request(app)
        .post('/api/billing/checkout/demo')
        .send({ planId: 'user', method: 'card' });
      expect(res.status).toBe(401);
    });

    it('activates a user plan successfully', async () => {
      const userId = 'user-abc';
      const token = makeToken(userId);
      mockProtectUser({ _id: userId, role: 'user', status: 'active' });

      BillingTransaction.findOne = vi.fn().mockResolvedValue(null);
      const mockSub = {
        userId,
        planId: 'user',
        status: 'active',
        usageSearch: 0,
        usageView: 0,
      };
      BillingSubscription.findOneAndUpdate = vi.fn().mockResolvedValue(mockSub);
      BillingTransaction.create = vi
        .fn()
        .mockResolvedValue({ _id: 'tx-1', planId: 'user', amount: 9 });

      const res = await request(app)
        .post('/api/billing/checkout/demo')
        .set(authHeader(token))
        .send({ planId: 'user', method: 'card' });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.subscription.planId).toBe('user');
    });

    it('rejects invalid planId', async () => {
      const token = makeToken();
      mockProtectUser({ _id: 'user-abc', role: 'user', status: 'active' });

      const res = await request(app)
        .post('/api/billing/checkout/demo')
        .set(authHeader(token))
        .send({ planId: 'gold', method: 'card' });

      expect(res.status).toBe(400);
    });

    it('prevents second trial purchase', async () => {
      const userId = 'user-abc';
      const token = makeToken(userId);
      mockProtectUser({ _id: userId, role: 'user', status: 'active' });

      BillingTransaction.findOne = vi.fn().mockResolvedValue({
        _id: 'tx-trial',
        planId: 'trial',
        status: 'completed',
      });

      const res = await request(app)
        .post('/api/billing/checkout/demo')
        .set(authHeader(token))
        .send({ planId: 'trial', method: 'card' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/вже використано/i);
    });

    it('allows trialing status for trial plan', async () => {
      const userId = 'fresh-user';
      const token = makeToken(userId);
      mockProtectUser({ _id: userId, role: 'user', status: 'active' });

      BillingTransaction.findOne = vi.fn().mockResolvedValue(null);
      const mockSub = { userId, planId: 'trial', status: 'trialing' };
      BillingSubscription.findOneAndUpdate = vi.fn().mockResolvedValue(mockSub);
      BillingTransaction.create = vi
        .fn()
        .mockResolvedValue({ _id: 'tx-2', planId: 'trial', amount: 1 });

      const res = await request(app)
        .post('/api/billing/checkout/demo')
        .set(authHeader(token))
        .send({ planId: 'trial', method: 'apple_pay' });

      expect(res.status).toBe(200);
      expect(res.body.subscription.status).toBe('trialing');
    });
  });

  // ── POST /api/admin/billing/:userId/assign ──────────────────────
  describe('POST /api/admin/billing/:userId/assign', () => {
    it('returns 403 for non-admin', async () => {
      const token = makeToken('user-abc');
      mockProtectUser({ _id: 'user-abc', role: 'user', status: 'active' });

      const res = await request(app)
        .post('/api/admin/billing/target-user/assign')
        .set(authHeader(token))
        .send({ planId: 'pro' });

      expect(res.status).toBe(403);
    });

    it('assigns plan as admin', async () => {
      const adminId = 'admin-abc';
      const targetId = 'user-xyz';
      const token = makeToken(adminId);

      User.findById = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockResolvedValue({
            _id: adminId,
            role: 'admin',
            status: 'active',
            fullName: 'Admin',
          }),
        })
        .mockReturnValueOnce({
          lean: vi.fn().mockResolvedValue({ _id: targetId, role: 'user' }),
        });

      const mockSub = { userId: targetId, planId: 'pro', status: 'active' };
      BillingSubscription.findOneAndUpdate = vi.fn().mockResolvedValue(mockSub);
      BillingTransaction.create = vi.fn().mockResolvedValue({
        _id: 'tx-3',
        amount: 0,
        method: 'admin_override',
      });

      const res = await request(app)
        .post(`/api/admin/billing/${targetId}/assign`)
        .set(authHeader(token))
        .send({ planId: 'pro' });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(BillingTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'admin_override', amount: 0 }),
      );
    });

    it('rejects invalid planId', async () => {
      const adminId = 'admin-abc';
      const token = makeToken(adminId);
      mockProtectUser({ _id: adminId, role: 'admin', status: 'active' });

      const res = await request(app)
        .post('/api/admin/billing/target-user/assign')
        .set(authHeader(token))
        .send({ planId: 'diamonds' });

      expect(res.status).toBe(400);
    });
  });
});
