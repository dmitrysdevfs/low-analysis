import express from 'express';
import * as amendmentController from '../controllers/amendmentController.js';
import {
  protect,
  hasPermission,
  authorize,
} from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/amendments:
 *   post:
 *     summary: Create amendment
 *     description: Create a new amendment for a law element inside proposal workflow.
 *     tags: [Amendments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [law_id, element_id, change_type]
 *             properties:
 *               law_id:
 *                 type: string
 *                 example: 69f84aa7395f1789bc7b2b89
 *               element_id:
 *                 type: string
 *                 example: 69f84aa7395f1789bc7b2b8a
 *               proposal_id:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439055
 *               change_type:
 *                 type: string
 *                 enum: [edit, add, delete]
 *               proposed_text:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Amendment created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Amendment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   get:
 *     summary: List amendments
 *     description: Filter amendments by proposalId, lawId or userId.
 *     tags: [Amendments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: proposalId
 *         schema: { type: string }
 *       - in: query
 *         name: lawId
 *         schema: { type: string }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Amendment list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Amendment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router
  .route('/')
  .post(
    protect,
    hasPermission('amendments:create'),
    amendmentController.createAmendment,
  )
  .get(protect, hasPermission('laws:read'), amendmentController.getAmendments);

/**
 * @swagger
 * /api/amendments/{id}:
 *   get:
 *     summary: Get amendment by id
 *     tags: [Amendments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Amendment details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Amendment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Amendment not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   patch:
 *     summary: Update amendment
 *     description: Update amendment text or reason while proposal is still editable.
 *     tags: [Amendments]
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
 *             properties:
 *               proposed_text:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated amendment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Amendment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Only the author can edit amendment in draft context
 *       404:
 *         description: Amendment not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   delete:
 *     summary: Delete amendment
 *     description: Remove amendment while proposal is still editable.
 *     tags: [Amendments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Amendment deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Only the author can delete amendment in draft context
 *       404:
 *         description: Amendment not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router
  .route('/:id')
  .get(
    protect,
    hasPermission('laws:read'),
    amendmentController.getAmendmentById,
  )
  .patch(
    protect,
    hasPermission('amendments:edit'),
    amendmentController.updateAmendment,
  )
  .delete(
    protect,
    hasPermission('amendments:delete'),
    amendmentController.deleteAmendment,
  );

router.patch(
  '/:id/review',
  protect,
  authorize('supervisor', 'admin'),
  amendmentController.reviewAmendment,
);

export default router;
