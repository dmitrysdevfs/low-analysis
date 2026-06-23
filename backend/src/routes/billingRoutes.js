import { Router } from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import * as billingController from '../controllers/billingController.js';

const router = Router();

/**
 * @swagger
 * /api/billing/plans:
 *   get:
 *     summary: List public billing plans
 *     tags: [Billing]
 *     responses:
 *       200:
 *         description: Billing plan catalogue
 */
router.get('/plans', billingController.getPlans);

/**
 * @swagger
 * /api/billing/me:
 *   get:
 *     summary: Get billing overview for current user
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Billing overview
 */
router.get('/me', protect, billingController.getMyBilling);

/**
 * @swagger
 * /api/billing/consume:
 *   post:
 *     summary: Consume billing quota unit
 *     tags: [Billing]
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
 *               type: { type: string, example: ai_request }
 *     responses:
 *       200:
 *         description: Usage recorded
 */
router.post('/consume', protect, billingController.consumeQuota);

/**
 * @swagger
 * /api/billing/checkout/demo:
 *   post:
 *     summary: Simulate checkout for a demo plan
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [planId]
 *             properties:
 *               planId: { type: string }
 *               method: { type: string, example: manual }
 *     responses:
 *       200:
 *         description: Demo checkout result
 */
router.post('/checkout/demo', protect, billingController.checkoutDemo);

/**
 * @swagger
 * /api/billing/admin/{userId}/assign:
 *   post:
 *     summary: Assign plan to user as admin
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [planId]
 *             properties:
 *               planId: { type: string }
 *     responses:
 *       200:
 *         description: Plan assigned
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
  '/admin/:userId/assign',
  protect,
  authorize('admin'),
  billingController.assignPlan,
);

export default router;
