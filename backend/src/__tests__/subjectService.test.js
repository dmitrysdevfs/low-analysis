import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as subjectService from '../services/subjectService.js';
import Subject from '../models/Subject.js';

vi.mock('../models/Subject.js');

describe('subjectService.searchSubjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns [] without querying for terms shorter than 2 chars', async () => {
    await expect(subjectService.searchSubjects('a')).resolves.toEqual([]);
    await expect(subjectService.searchSubjects('  б  ')).resolves.toEqual([]);
    await expect(subjectService.searchSubjects('')).resolves.toEqual([]);
    await expect(subjectService.searchSubjects(undefined)).resolves.toEqual([]);

    expect(Subject.find).not.toHaveBeenCalled();
  });
});
