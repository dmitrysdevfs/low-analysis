import { Router } from 'express';
import { guestRateLimit } from '../middleware/guestRateLimit.js';
import {
  getLawGraph,
  getGlobalGraphHandler,
  getGraphPath,
  getGraphSubjectsHandler,
} from '../controllers/graphController.js';

const router = Router();

router.use(guestRateLimit);

/**
 * @swagger
 * /api/graph/subjects:
 *   get:
 *     summary: List graph subjects
 *     tags: [Graph]
 *     responses:
 *       200:
 *         description: Subject palette used by graph views
 */
router.get('/subjects', getGraphSubjectsHandler);

/**
 * @swagger
 * /api/graph/law/{id}:
 *   get:
 *     summary: Build graph for one law
 *     tags: [Graph]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: depth
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 3
 *           default: 1
 *     responses:
 *       200:
 *         description: Law graph with nodes and edges
 *       400:
 *         description: Invalid law id
 */
router.get('/law/:id', getLawGraph);

/**
 * @swagger
 * /api/graph/global:
 *   get:
 *     summary: Build global law reference graph
 *     tags: [Graph]
 *     responses:
 *       200:
 *         description: Global graph with nodes and edges
 */
router.get('/global', getGlobalGraphHandler);

/**
 * @swagger
 * /api/graph/path:
 *   get:
 *     summary: Find shortest path between two laws
 *     tags: [Graph]
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: to
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Path found
 *       400:
 *         description: Missing or invalid ids
 *       404:
 *         description: No path found
 */
router.get('/path', getGraphPath);

export default router;
