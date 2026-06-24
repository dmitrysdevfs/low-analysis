import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createFork,
  getMyForks,
  getForkById,
  updateFork,
  deleteFork,
} from '../controllers/graphForkController.js';

const router = Router();

router.use(protect);

/**
 * @swagger
 * /api/graph-forks/my:
 *   get:
 *     summary: Get current user's graph forks
 *     tags: [Forks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Graph forks
 */
router.get('/my', getMyForks);

/**
 * @swagger
 * /api/graph-forks:
 *   post:
 *     summary: Create graph fork
 *     tags: [Forks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               viewState:
 *                 type: object
 *                 additionalProperties: true
 *               filters:
 *                 type: object
 *                 additionalProperties: true
 *               pathState:
 *                 type: object
 *                 additionalProperties: true
 *               isPublic: { type: boolean }
 *     responses:
 *       201:
 *         description: Graph fork created
 */
router.post('/', createFork);

/**
 * @swagger
 * /api/graph-forks/{id}:
 *   get:
 *     summary: Get graph fork by id
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
 *         description: Graph fork details
 *       403:
 *         description: Fork is private and owned by another user
 *       404:
 *         description: Fork not found
 *   put:
 *     summary: Update graph fork
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
 *         description: Updated graph fork
 *       404:
 *         description: Fork not found or not owned by current user
 *   delete:
 *     summary: Delete graph fork
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
 *         description: Graph fork deleted
 *       404:
 *         description: Fork not found or not owned by current user
 */
router.get('/:id', getForkById);
router.put('/:id', updateFork);
router.delete('/:id', deleteFork);

export default router;
