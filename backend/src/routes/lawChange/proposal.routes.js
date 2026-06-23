import express from 'express';
import * as proposalController from '../../controllers/lawChange/proposal.controller.js';
import {
  protect,
  hasPermission,
  authorize,
} from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/law-change/proposals:
 *   post:
 *     summary: Create a law change proposal (legislator only)
 *     tags: [LawChange]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [law_id, change_type]
 *             properties:
 *               law_id: { type: string }
 *               element_id: { type: string }
 *               change_type: { type: string, enum: [edit, add, delete, move] }
 *               proposed_text: { type: string }
 *               reason: { type: string }
 *   get:
 *     summary: List proposals with optional filters
 *     tags: [LawChange]
 *     security:
 *       - bearerAuth: []
 */
router
  .route('/')
  .post(
    protect,
    hasPermission('law_changes:propose'),
    proposalController.createProposal,
  )
  .get(
    protect,
    hasPermission('law_changes:read'),
    proposalController.getProposals,
  );

/**
 * @swagger
 * /api/law-change/proposals/my:
 *   get:
 *     summary: Get my proposals
 *     tags: [LawChange]
 *     security:
 *       - bearerAuth: []
 */
router.get('/my', protect, proposalController.getMyProposals);

/**
 * @swagger
 * /api/law-change/proposals/{id}:
 *   get:
 *     summary: Get proposal by ID
 *     tags: [LawChange]
 *     security:
 *       - bearerAuth: []
 *   patch:
 *     summary: Update draft proposal (author only)
 *     tags: [LawChange]
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     summary: Delete draft proposal (author only)
 *     tags: [LawChange]
 *     security:
 *       - bearerAuth: []
 */
router
  .route('/:id')
  .get(
    protect,
    hasPermission('law_changes:read'),
    proposalController.getProposalById,
  )
  .patch(
    protect,
    hasPermission('law_changes:propose'),
    proposalController.updateProposal,
  )
  .delete(
    protect,
    hasPermission('law_changes:propose'),
    proposalController.deleteProposal,
  );

/**
 * @swagger
 * /api/law-change/proposals/{id}/submit:
 *   post:
 *     summary: Submit draft proposal to active (author only)
 *     tags: [LawChange]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/submit',
  protect,
  hasPermission('law_changes:propose'),
  proposalController.submitProposal,
);

/**
 * @swagger
 * /api/law-change/proposals/{id}/withdraw:
 *   post:
 *     summary: Withdraw proposal (author only)
 *     tags: [LawChange]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/withdraw',
  protect,
  hasPermission('law_changes:propose'),
  proposalController.withdrawProposal,
);

/**
 * @swagger
 * /api/law-change/proposals/{id}/review:
 *   post:
 *     summary: Review a proposal as supervisor or admin
 *     tags: [LawChange]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Proposal reviewed
 *       400:
 *         description: Invalid review payload
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Proposal not found
 */
router.post(
  '/:id/review',
  protect,
  authorize('supervisor', 'admin'),
  proposalController.reviewProposal,
);

export default router;
