import express from 'express';
import proposalRoutes from './proposal.routes.js';
import voteRoutes from './vote.routes.js';
import approvedChangeRoutes from './approvedChange.routes.js';
import legislatorRequestRoutes from './legislatorRequest.routes.js';
import * as legislatorRequestController from '../../controllers/lawChange/legislatorRequest.controller.js';
import { protect, authorize } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Approved changes & law view (no /proposals prefix)
router.use('/', approvedChangeRoutes);

// Proposals CRUD
router.use('/proposals', proposalRoutes);

// Vote sub-routes nested under proposals
router.use('/proposals/:proposalId', voteRoutes);

// Legislator access requests
router.use('/legislator-requests', legislatorRequestRoutes);

/**
 * @swagger
 * /api/law-change/admin/users/{id}/role:
 *   patch:
 *     summary: Set user role (admin only)
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
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [user, paid_user, legislator, admin] }
 */
router.patch('/admin/users/:id/role', protect, authorize('admin'), legislatorRequestController.setUserRole);

export default router;
