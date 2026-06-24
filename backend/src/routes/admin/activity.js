import { Router } from 'express';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import * as ctrl from '../../controllers/admin/activity.controller.js';

const router = Router();
router.use(protect, authorize('admin'));

/**
 * @swagger
 * /api/admin/activity/{userId}:
 *   get:
 *     summary: Активність конкретного користувача
 *     description: >
 *       Повертає хронологію дій користувача: логіни, зміни профілю, роботу з законами,
 *       звернення в підтримку, API-виклики.
 *     tags: [AdminActivity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId користувача
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Список подій активності
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Користувача не знайдено
 */
router.get('/:userId', ctrl.getUserActivity);
export default router;
