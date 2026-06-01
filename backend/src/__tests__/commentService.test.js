import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as commentService from '../services/commentService.js';
import Comment from '../models/Comment.js';

vi.mock('../models/Comment.js');

describe('commentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add a comment', async () => {
    Comment.create.mockResolvedValue({ text: 'Nice' });
    const result = await commentService.addComment({ text: 'Nice' });
    expect(Comment.create).toHaveBeenCalled();
    expect(result.text).toBe('Nice');
  });

  it('should get comments', async () => {
    Comment.find.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockResolvedValue([{ text: 'c1' }]),
    });

    const result = await commentService.getComments('amendment', 'a1');
    expect(Comment.find).toHaveBeenCalledWith({
      target_type: 'amendment',
      target_id: 'a1',
    });
    expect(result).toHaveLength(1);
  });
});
