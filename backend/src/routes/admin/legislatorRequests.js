import { Router } from 'express';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import { patchLegislatorRequest } from '../../controllers/admin/legislatorRequests.controller.js';

const router = Router();
router.use(protect, authorize('admin'));

/**
 * @swagger
 * /api/admin/legislator-requests/{id}:
 *   patch:
 *     summary: Review a legislator access request
 *     description: Approves a pending request and upgrades the user to legislator, or rejects it with an optional note.
 *     tags: [Admin]
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
 *         description: Request reviewed successfully
 *       400:
 *         description: Unsupported action
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Request not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch('/:id', patchLegislatorRequest);
export default router;
