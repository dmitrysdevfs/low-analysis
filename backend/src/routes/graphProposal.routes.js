import express from 'express';
import * as ctrl from '../controllers/graphProposal.controller.js';
import { protect, hasPermission, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/graph-proposals:
 *   post:
 *     summary: Create graph proposal
 *     tags: [GraphProposals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       201:
 *         description: Proposal created
 *   get:
 *     summary: List graph proposals
 *     tags: [GraphProposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: proposal_type
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Proposal list
 */
router.post('/', protect, hasPermission('graph_proposals:create'), ctrl.createProposal);
router.get('/', protect, hasPermission('law_changes:read'), ctrl.getProposals);

/**
 * @swagger
 * /api/graph-proposals/my:
 *   get:
 *     summary: Get my graph proposals
 *     tags: [GraphProposals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user's graph proposals
 */
router.get('/my', protect, ctrl.getMyProposals);

/**
 * @swagger
 * /api/graph-proposals/{id}:
 *   get:
 *     summary: Get graph proposal by id
 *     tags: [GraphProposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Proposal details
 *   patch:
 *     summary: Update graph proposal
 *     tags: [GraphProposals]
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
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Updated proposal
 *   delete:
 *     summary: Delete graph proposal
 *     tags: [GraphProposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Proposal deleted
 */
router.get('/:id', protect, hasPermission('law_changes:read'), ctrl.getProposalById);
router.patch('/:id', protect, hasPermission('graph_proposals:create'), ctrl.updateProposal);
router.delete('/:id', protect, hasPermission('graph_proposals:create'), ctrl.deleteProposal);

/**
 * @swagger
 * /api/graph-proposals/{id}/submit:
 *   post:
 *     summary: Submit graph proposal
 *     tags: [GraphProposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Submitted proposal
 */
router.post('/:id/submit', protect, hasPermission('graph_proposals:create'), ctrl.submitProposal);

/**
 * @swagger
 * /api/graph-proposals/{id}/withdraw:
 *   post:
 *     summary: Withdraw graph proposal
 *     tags: [GraphProposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Withdrawn proposal
 */
router.post('/:id/withdraw', protect, ctrl.withdrawProposal);

/**
 * @swagger
 * /api/graph-proposals/{id}/vote:
 *   post:
 *     summary: Cast or update vote on graph proposal
 *     tags: [GraphProposals]
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
 *             required: [vote]
 *             properties:
 *               vote:
 *                 type: string
 *                 enum: [for, against]
 *     responses:
 *       200:
 *         description: Updated proposal after vote
 *   delete:
 *     summary: Remove current user's vote from graph proposal
 *     tags: [GraphProposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated proposal after vote removal
 */
router.post('/:id/vote', protect, hasPermission('graph_proposals:vote'), ctrl.castVote);
router.delete('/:id/vote', protect, ctrl.removeVote);

/**
 * @swagger
 * /api/graph-proposals/{id}/votes:
 *   get:
 *     summary: Get graph proposal vote statistics
 *     tags: [GraphProposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Vote stats
 */
router.get('/:id/votes', protect, hasPermission('law_changes:read'), ctrl.getVoteStats);

/**
 * @swagger
 * /api/graph-proposals/{id}/review:
 *   post:
 *     summary: Review graph proposal
 *     tags: [GraphProposals]
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
 *     responses:
 *       200:
 *         description: Reviewed proposal
 */
router.post('/:id/review', protect, authorize('supervisor', 'admin'), ctrl.reviewProposal);

export default router;
