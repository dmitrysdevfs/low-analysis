import express from 'express';
import * as voteController from '../../controllers/lawChange/vote.controller.js';
import { protect, hasPermission } from '../../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * /api/law-change/proposals/{proposalId}/vote:
 *   post:
 *     summary: Cast or update vote on a proposal
 *     tags: [LawChange]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vote]
 *             properties:
 *               vote: { type: string, enum: [for, against] }
 *   delete:
 *     summary: Remove your vote from a proposal
 *     tags: [LawChange]
 *     security:
 *       - bearerAuth: []
 */
router
  .route('/vote')
  .post(protect, hasPermission('law_changes:vote'), voteController.castVote)
  .delete(
    protect,
    hasPermission('law_changes:vote'),
    voteController.removeVote,
  );

/**
 * @swagger
 * /api/law-change/proposals/{proposalId}/votes:
 *   get:
 *     summary: Get vote stats + my vote for a proposal
 *     tags: [LawChange]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/votes',
  protect,
  hasPermission('law_changes:read'),
  voteController.getVoteStats,
);

export default router;
