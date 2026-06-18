import { Router } from 'express';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import { assignPlan } from '../../controllers/billingController.js';

const router = Router();
router.use(protect, authorize('admin'));

/**
 * @swagger
 * /api/admin/billing/{userId}/assign:
 *   post:
 *     summary: Призначити тарифний план користувачу
 *     description: Адмін може вручну призначити або оновити план підписки для будь-якого користувача.
 *     tags: [AdminBilling]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId користувача
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan]
 *             properties:
 *               plan: { type: string, enum: [free, basic, premium, enterprise] }
 *               expiresAt: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: План призначено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 *                 plan: { type: string }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Користувача не знайдено
 */
router.post('/:userId/assign', assignPlan);

export default router;
