import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as amendmentService from '../services/amendmentService.js';
import Amendment from '../models/Amendment.js';
import ApprovedChange from '../models/ApprovedChange.js';
import Element from '../models/Element.js';
import Proposal from '../models/Proposal.js';

const ELEMENT_ID = '507f1f77bcf86cd799439011';
const SECTION_ID = '507f1f77bcf86cd799439012';

vi.mock('../models/Amendment.js');
vi.mock('../models/ApprovedChange.js');
vi.mock('../models/Element.js');
vi.mock('../models/Proposal.js');

describe('amendmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Proposal.findByIdAndUpdate.mockResolvedValue({
      _id: 'proposal1',
      amendments_count: 1,
    });
  });

  describe('createAmendment', () => {
    it('should create an amendment and populate context', async () => {
      const mockElement = {
        _id: ELEMENT_ID,
        code: 'CU.A1',
        number: '1',
        title: 'Article 1',
        text: 'Original text',
        type: 'article',
        parentId: SECTION_ID,
      };

      const mockSection = {
        _id: SECTION_ID,
        type: 'section',
        title: 'Section 1',
        parentId: null,
      };

      Element.aggregate.mockResolvedValue([
        {
          ...mockElement,
          ancestors: [mockSection],
        },
      ]);

      Amendment.create.mockResolvedValue({ _id: 'amendment1' });

      const data = {
        law_id: 'law1',
        element_id: ELEMENT_ID,
        proposal_id: 'proposal1',
        created_by: 'user1',
        change_type: 'edit',
        proposed_text: 'New text',
        reason: 'Better wording',
      };

      const result = await amendmentService.createAmendment(data);

      expect(Element.aggregate).toHaveBeenCalled();
      expect(Amendment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          law_id: 'law1',
          element_id: ELEMENT_ID,
          proposal_id: 'proposal1',
          created_by: 'user1',
          change_type: 'edit',
          proposed_text: 'New text',
          reason: 'Better wording',
          context: expect.objectContaining({
            article_num: '1',
            section_title: 'Section 1',
          }),
        }),
      );
      expect(Proposal.findByIdAndUpdate).toHaveBeenCalledWith('proposal1', {
        $inc: { amendments_count: 1 },
      });
      expect(result).toHaveProperty('_id', 'amendment1');
    });

    it('should set original_text to null for add change_type', async () => {
      const mockElement = {
        _id: 'element1',
        code: 'CU.A1',
        number: '1',
        title: 'Article 1',
        text: 'Original text',
        type: 'article',
        parentId: null,
      };

      Element.aggregate.mockResolvedValue([
        {
          ...mockElement,
          ancestors: [],
        },
      ]);

      Amendment.create.mockResolvedValue({ _id: 'amendment1' });

      const data = {
        law_id: 'law1',
        element_id: ELEMENT_ID,
        proposal_id: 'proposal1',
        created_by: 'user1',
        change_type: 'add',
        proposed_text: 'New added text',
        reason: 'Adding important clause',
      };

      await amendmentService.createAmendment(data);

      expect(Amendment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          original_text: null,
          proposed_text: 'New added text',
        }),
      );
    });

    it('should set proposed_text to null for delete change_type', async () => {
      const mockElement = {
        _id: 'element1',
        code: 'CU.A1',
        number: '1',
        title: 'Article 1',
        text: 'Original text',
        type: 'article',
        parentId: null,
      };

      Element.aggregate.mockResolvedValue([
        {
          ...mockElement,
          ancestors: [],
        },
      ]);

      Amendment.create.mockResolvedValue({ _id: 'amendment1' });

      const data = {
        law_id: 'law1',
        element_id: ELEMENT_ID,
        proposal_id: 'proposal1',
        created_by: 'user1',
        change_type: 'delete',
        proposed_text: 'Should be ignored',
        reason: 'Removing obsolete clause',
      };

      await amendmentService.createAmendment(data);

      expect(Amendment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          original_text: 'Original text',
          proposed_text: null,
        }),
      );
    });
  });

  describe('getAmendmentsByProposal', () => {
    it('should return amendments for a proposal', async () => {
      Amendment.find.mockReturnValue({
        sort: vi.fn().mockResolvedValue([{ _id: 'a1' }]),
      });

      const result = await amendmentService.getAmendmentsByProposal('p1');
      expect(Amendment.find).toHaveBeenCalledWith({ proposal_id: 'p1' });
      expect(result).toHaveLength(1);
    });
  });

  describe('reviewAmendment', () => {
    it('should throw 404 if amendment not found', async () => {
      Amendment.findById.mockResolvedValue(null);

      await expect(
        amendmentService.reviewAmendment('missing', 'approve'),
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should throw 409 if amendment already reviewed', async () => {
      Amendment.findById.mockResolvedValue({
        _id: 'a1',
        status: 'approved',
        save: vi.fn(),
      });

      await expect(
        amendmentService.reviewAmendment('a1', 'approve'),
      ).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('should set status to rejected without touching ApprovedChange', async () => {
      const mockAmendment = {
        _id: 'a1',
        status: 'pending',
        element_id: ELEMENT_ID,
        save: vi.fn().mockResolvedValue(true),
      };
      Amendment.findById.mockResolvedValue(mockAmendment);

      await amendmentService.reviewAmendment('a1', 'reject');

      expect(mockAmendment.status).toBe('rejected');
      expect(mockAmendment.save).toHaveBeenCalled();
      expect(ApprovedChange.updateMany).not.toHaveBeenCalled();
      expect(ApprovedChange.create).not.toHaveBeenCalled();
    });

    it('should approve and create ApprovedChange when element_id exists', async () => {
      const mockAmendment = {
        _id: 'a1',
        status: 'pending',
        element_id: ELEMENT_ID,
        law_id: 'law1',
        change_type: 'edit',
        proposed_text: 'New text',
        save: vi.fn().mockResolvedValue(true),
      };
      Amendment.findById.mockResolvedValue(mockAmendment);
      ApprovedChange.updateMany.mockResolvedValue({});
      ApprovedChange.create.mockResolvedValue({ _id: 'ac1' });

      await amendmentService.reviewAmendment('a1', 'approve');

      expect(mockAmendment.status).toBe('approved');
      expect(ApprovedChange.updateMany).toHaveBeenCalledWith(
        { element_id: ELEMENT_ID, is_current: true },
        { is_current: false },
      );
      expect(ApprovedChange.create).toHaveBeenCalledWith(
        expect.objectContaining({
          law_id: 'law1',
          element_id: ELEMENT_ID,
          change_type: 'edit',
          new_text: 'New text',
          is_current: true,
          status: 'active',
        }),
      );
    });

    it('should approve without ApprovedChange when element_id is missing', async () => {
      const mockAmendment = {
        _id: 'a2',
        status: 'pending',
        element_id: null,
        save: vi.fn().mockResolvedValue(true),
      };
      Amendment.findById.mockResolvedValue(mockAmendment);

      await amendmentService.reviewAmendment('a2', 'approve');

      expect(mockAmendment.status).toBe('approved');
      expect(ApprovedChange.updateMany).not.toHaveBeenCalled();
      expect(ApprovedChange.create).not.toHaveBeenCalled();
    });
  });
});
