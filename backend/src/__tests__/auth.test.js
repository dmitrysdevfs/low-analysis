import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

vi.mock('../models/User.js');
vi.mock('../services/admin/superCode.service.js', () => ({
  getActiveCode: vi.fn().mockResolvedValue('LOW-TEST-CODE'),
}));
vi.mock('../modules/email/email.service.js', () => ({
  sendTransactionalEmail: vi.fn().mockResolvedValue({ messageId: 'mock-id' }),
}));
vi.mock('../models/EmailLog.js', () => ({
  default: { create: vi.fn().mockResolvedValue({}) },
}));

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and send verification email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'mock-user-id',
        ...userData,
        role: 'user',
        tokenVersion: 0,
        save: vi.fn().mockResolvedValue(true),
      });

      const res = await request(app).post('/api/auth/register').send(userData);

      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/email/i);
      expect(User.create).toHaveBeenCalled();
      expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('should return 400 if user already exists', async () => {
      User.findOne.mockResolvedValue({ email: 'test@example.com' });

      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user and return a token', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        _id: 'mock-user-id',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'user',
        tokenVersion: 0,
        isVerified: true,
        comparePassword: vi.fn().mockResolvedValue(true),
      };

      // Mock chainable findOne().select()
      User.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      });
      User.findByIdAndUpdate.mockReturnValue({ catch: vi.fn() });

      const res = await request(app).post('/api/auth/login').send(userData);

      expect(res.status).toBe(200);
      expect(mockUser.comparePassword).toHaveBeenCalledWith(userData.password);
      expect(res.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('token=')]),
      );
    });

    it('should return 401 for invalid credentials', async () => {
      User.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@example.com', password: 'wrong' });

      expect(res.status).toBe(401);
    });

    it('should return 403 for an unverified admin in production', async () => {
      const mockUser = {
        _id: 'mock-admin-id',
        email: 'admin@lowanalysis.com',
        fullName: 'Admin User',
        role: 'admin',
        tokenVersion: 0,
        isVerified: false,
        comparePassword: vi.fn().mockResolvedValue(true),
      };

      User.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      });

      vi.stubEnv('NODE_ENV', 'production');

      try {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ email: mockUser.email, password: 'password123' });

        expect(res.status).toBe(403);
        expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
      } finally {
        vi.unstubAllEnvs();
      }
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile if authorized', async () => {
      const mockUser = {
        _id: 'mock-user-id',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'user',
        status: 'active',
        tokenVersion: 0,
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve(mockUser)),
        catch: vi.fn(),
      };

      User.findById.mockReturnValue(mockQuery);

      // We need a real token for the middleware or mock the middleware

      // Since we want to test the full flow, we'll sign a token
      const token = jwt.sign({ id: 'mock-user-id' }, process.env.JWT_SECRET);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(mockUser.email);
    });

    it('should return 401 if no token provided', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/register with admin role', () => {
    it('should register an admin if correct superCode is provided', async () => {
      const userData = {
        email: 'admin_test@example.com',
        password: 'password123',
        displayName: 'Test Admin',
        accountType: 'admin',
        superCode: 'LOW-TEST-CODE',
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'mock-admin-id',
        email: userData.email,
        fullName: userData.displayName,
        role: 'admin',
        tokenVersion: 0,
        save: vi.fn().mockResolvedValue(true),
      });

      const res = await request(app).post('/api/auth/register').send(userData);

      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/email/i);
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'admin',
          fullName: 'Test Admin',
        }),
      );
    });

    it('should return 400 if incorrect superCode is provided', async () => {
      const userData = {
        email: 'admin_test@example.com',
        password: 'password123',
        displayName: 'Test Admin',
        accountType: 'admin',
        superCode: 'WRONG-CODE',
      };

      const res = await request(app).post('/api/auth/register').send(userData);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('супер-код');
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile if authorized', async () => {
      const mockUser = {
        _id: 'mock-user-id',
        email: 'test@example.com',
        fullName: 'Original Name',
        role: 'user',
        status: 'active',
        tokenVersion: 0,
        save: vi.fn().mockResolvedValue({
          _id: 'mock-user-id',
          email: 'test@example.com',
          fullName: 'Updated Name',
          role: 'user',
          status: 'active',
        }),
      };

      User.findById.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve(mockUser)),
        catch: vi.fn(),
      });

      const token = jwt.sign({ id: 'mock-user-id' }, process.env.JWT_SECRET);

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ displayName: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.fullName).toBe('Updated Name');
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('PUT /api/auth/password', () => {
    it('should update password with correct current password', async () => {
      const mockUser = {
        _id: 'mock-user-id',
        email: 'test@example.com',
        fullName: 'Original Name',
        role: 'user',
        status: 'active',
        tokenVersion: 0,
        password: 'hashedpassword',
        comparePassword: vi.fn().mockResolvedValue(true),
        save: vi.fn().mockResolvedValue(true),
      };

      User.findById.mockReturnValue({
        select: vi.fn().mockReturnValue(mockUser),
      });

      const token = jwt.sign({ id: 'mock-user-id' }, process.env.JWT_SECRET);

      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'password123',
          nextPassword: 'newpassword123',
        });

      expect(res.status).toBe(200);
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      // For now, we rely on the User model's pre('save') hook to hash the password before actual DB write.
      // The controller just assigns the password to the user document and calls save().
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should return 400 with incorrect current password', async () => {
      const mockUser = {
        _id: 'mock-user-id',
        email: 'test@example.com',
        fullName: 'Original Name',
        role: 'user',
        status: 'active',
        tokenVersion: 0,
        password: 'hashedpassword',
        comparePassword: vi.fn().mockResolvedValue(false),
      };

      User.findById.mockReturnValue({
        select: vi.fn().mockReturnValue(mockUser),
      });

      const token = jwt.sign({ id: 'mock-user-id' }, process.env.JWT_SECRET);

      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrongpassword',
          nextPassword: 'newpassword123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Current password is incorrect');
    });
  });
});
