import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import * as ctrl from '../controllers/activity.controller.js';

const router = Router();
router.use(protect);

/**
 * @swagger
 * /api/activity:
 *   post:
 *     summary: Track authenticated client activity event
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type: { type: string, example: search_opened }
 *               path: { type: string, example: /laws/123 }
 *               query:
 *                 type: object
 *                 additionalProperties: true
 *               lawId: { type: string }
 *               meta:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       201:
 *         description: Event tracked
 *       400:
 *         description: Missing event type
 */
router.post('/', ctrl.trackEvent);

export default router;
