import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import dotenv from 'dotenv';
import app from '../app.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

dotenv.config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_12345';

vi.mock('../models/User.js');
vi.mock('../services/admin/superCode.service.js', () => ({
  getActiveCode: vi.fn().mockResolvedValue('SUPER-001'),
}));

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and return a token', async () => {
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
      });

      const res = await request(app).post('/api/auth/register').send(userData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe(userData.email);
      expect(User.create).toHaveBeenCalled();
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
        comparePassword: vi.fn().mockResolvedValue(true),
      };

      // Mock chainable findOne().select()
      User.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      });

      const res = await request(app).post('/api/auth/login').send(userData);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(mockUser.comparePassword).toHaveBeenCalledWith(userData.password);
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
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile if authorized', async () => {
      const mockUser = {
        _id: 'mock-user-id',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'user',
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
        superCode: 'SUPER-001',
      };

      process.env.ADMIN_SUPER_CODE = 'SUPER-001';

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'mock-admin-id',
        email: userData.email,
        fullName: userData.displayName,
        role: 'admin',
      });

      const res = await request(app).post('/api/auth/register').send(userData);

      expect(res.status).toBe(201);
      expect(res.body.role).toBe('admin');
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

      process.env.ADMIN_SUPER_CODE = 'SUPER-001';

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
        save: vi.fn().mockResolvedValue({
          _id: 'mock-user-id',
          email: 'test@example.com',
          fullName: 'Updated Name',
          role: 'user',
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
