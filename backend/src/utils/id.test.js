import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { castToObjectId, compareIds } from './id.js';

describe('id utility', () => {
  describe('castToObjectId', () => {
    it('should convert valid 24-character hex string to ObjectId', () => {
      const hex = '507f1f77bcf86cd799439011';
      const result = castToObjectId(hex);
      expect(result).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(result.toString()).toBe(hex);
    });

    it('should return the original value if it is already an ObjectId', () => {
      const oid = new mongoose.Types.ObjectId();
      const result = castToObjectId(oid);
      expect(result).toBe(oid);
    });

    it('should return original invalid string without throwing', () => {
      const invalidStr = 'shortId';
      const result = castToObjectId(invalidStr);
      expect(result).toBe(invalidStr);
    });

    it('should handle null or undefined input', () => {
      expect(castToObjectId(null)).toBeNull();
      expect(castToObjectId(undefined)).toBeUndefined();
    });
  });

  describe('compareIds', () => {
    it('should return true for matching ObjectIds', () => {
      const oid1 = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
      const oid2 = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
      expect(compareIds(oid1, oid2)).toBe(true);
    });

    it('should return true when comparing ObjectId to matching valid string', () => {
      const hex = '507f1f77bcf86cd799439011';
      const oid = new mongoose.Types.ObjectId(hex);
      expect(compareIds(oid, hex)).toBe(true);
      expect(compareIds(hex, oid)).toBe(true);
    });

    it('should return false for different ObjectIds', () => {
      const oid1 = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
      const oid2 = new mongoose.Types.ObjectId('507f1f77bcf86cd799439012');
      expect(compareIds(oid1, oid2)).toBe(false);
    });

    it('should return true for matching short invalid strings (mocks)', () => {
      expect(compareIds('u1', 'u1')).toBe(true);
    });

    it('should return false for different short invalid strings (mocks)', () => {
      expect(compareIds('u1', 'u2')).toBe(false);
    });

    it('should return true when comparing ObjectId-like short string to itself', () => {
      expect(compareIds('user123', 'user123')).toBe(true);
    });

    it('should return false if one or both inputs are missing/falsy', () => {
      const oid = new mongoose.Types.ObjectId();
      expect(compareIds(oid, null)).toBe(false);
      expect(compareIds(null, oid)).toBe(false);
      expect(compareIds(null, undefined)).toBe(false);
    });
  });
});
