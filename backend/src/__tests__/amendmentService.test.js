import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as amendmentService from '../services/amendmentService.js';
import Amendment from '../models/Amendment.js';
import Element from '../models/Element.js';
import Proposal from '../models/Proposal.js';

vi.mock('../models/Amendment.js');
vi.mock('../models/Element.js');
vi.mock('../models/Proposal.js');

describe('amendmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAmendment', () => {
    it('should create an amendment and populate context', async () => {
      const mockElement = {
        _id: 'element1',
        code: 'CU.A1',
        number: '1',
        title: 'Article 1',
        text: 'Original text',
        type: 'article',
        parentId: 'section1',
      };

      const mockSection = {
        _id: 'section1',
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
        element_id: 'element1',
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
        element_id: 'element1',
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
        element_id: 'element1',
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
});
