import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import {
  checkAndIncrementApiGuard,
  getApiGuardStatus,
} from '../modules/assistant/assistant.api-guard.model.js';

describe('AssistantApiGuard Model', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return allowed=true and incremented count when within limits', async () => {
    const mockModel = mongoose.model('AssistantApiGuard');
    const today = new Date().toISOString().slice(0, 10);
    
    const spyFindOneAndUpdate = vi
      .spyOn(mockModel, 'findOneAndUpdate')
      .mockResolvedValue({
        _id: 'daily',
        date: today,
        count: 5,
      });

    const res = await checkAndIncrementApiGuard(10);

    const expectedResetAt = new Date(`${today}T24:00:00.000Z`);
    expect(spyFindOneAndUpdate).toHaveBeenCalled();
    expect(res.allowed).toBe(true);
    expect(res.used).toBe(5);
    expect(res.limit).toBe(10);
    expect(res.resetAt.toISOString()).toBe(expectedResetAt.toISOString());
  });

  it('should return allowed=false when limit is exceeded', async () => {
    const mockModel = mongoose.model('AssistantApiGuard');
    const today = new Date().toISOString().slice(0, 10);
    
    vi.spyOn(mockModel, 'findOneAndUpdate').mockResolvedValue({
      _id: 'daily',
      date: today,
      count: 11,
    });

    const res = await checkAndIncrementApiGuard(10);

    expect(res.allowed).toBe(false);
    expect(res.used).toBe(11);
    expect(res.limit).toBe(10);
  });

  it('should retrieve current quota status without incrementing', async () => {
    const mockModel = mongoose.model('AssistantApiGuard');
    const today = new Date().toISOString().slice(0, 10);
    
    const spyFindById = vi.spyOn(mockModel, 'findById').mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'daily',
        date: today,
        count: 15,
      }),
    });

    const res = await getApiGuardStatus(20);

    expect(spyFindById).toHaveBeenCalled();
    expect(res.used).toBe(15);
    expect(res.limit).toBe(20);
  });

  it('should return 0 used if no document exists in database for today', async () => {
    const mockModel = mongoose.model('AssistantApiGuard');
    vi.spyOn(mockModel, 'findById').mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });

    const res = await getApiGuardStatus(20);
    expect(res.used).toBe(0);
  });
});
