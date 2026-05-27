import express from 'express';
import * as roadmapController from './roadmap.controller.js';
import { authorize, protect } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

/**
 * @swagger
 * /api/admin/roadmap:
 *   get:
 *     summary: Отримати поточний roadmap для адмінки
 *     tags: [Roadmap]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Повний roadmap з метаданими
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', roadmapController.getRoadmap);

/**
 * @swagger
 * /api/admin/roadmap:
 *   put:
 *     summary: Оновити контент roadmap
 *     tags: [Roadmap]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Оновлений roadmap
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put('/', roadmapController.updateRoadmap);

export default router;
