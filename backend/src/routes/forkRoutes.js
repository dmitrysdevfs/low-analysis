import { Router } from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import * as forkController from '../controllers/forkController.js';

const router = Router();
router.use(protect);
router.use(authorize('legislator', 'supervisor', 'admin'));

/**
 * @swagger
 * /api/forks/me:
 *   get:
 *     summary: Get current user's forks
 *     tags: [Forks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User forks
 */
router.get('/me', forkController.getMyForks);

/**
 * @swagger
 * /api/forks/law/{lawId}:
 *   get:
 *     summary: Get forks for a law
 *     tags: [Forks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lawId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Forks for selected law
 */
router.get('/law/:lawId', forkController.getLawForks);

/**
 * @swagger
 * /api/forks:
 *   post:
 *     summary: Create law fork
 *     tags: [Forks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lawId, title]
 *             properties:
 *               lawId: { type: string }
 *               title: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Fork created
 */
router.post('/', forkController.createFork);

/**
 * @swagger
 * /api/forks/{id}:
 *   get:
 *     summary: Get fork by id
 *     tags: [Forks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: mine
 *         schema: { type: string, enum: ['1'] }
 *         description: Set to 1 to resolve owner-only view rules
 *     responses:
 *       200:
 *         description: Fork details
 *       404:
 *         description: Fork not found
 */
router.get('/:id', forkController.getFork);

/**
 * @swagger
 * /api/forks/{id}/changes:
 *   post:
 *     summary: Add change to fork
 *     tags: [Forks]
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
 *         description: Change added to fork
 */
router.post('/:id/changes', forkController.addChange);

/**
 * @swagger
 * /api/forks/{id}/submit:
 *   post:
 *     summary: Submit fork for review
 *     tags: [Forks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Fork submitted
 */
router.post('/:id/submit', forkController.submitFork);

/**
 * @swagger
 * /api/forks/{id}/diff:
 *   get:
 *     summary: Get fork diff
 *     tags: [Forks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Fork diff payload
 *       404:
 *         description: Fork not found
 */
router.get('/:id/diff', forkController.getForkDiff);

export default router;
