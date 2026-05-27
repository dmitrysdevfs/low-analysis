import express from 'express';
import * as roadmapController from './roadmap.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/roadmap:
 *   get:
 *     summary: Публічний контент roadmap проєкту
 *     tags: [Roadmap]
 *     responses:
 *       200:
 *         description: Поточний стан roadmap
 */
router.get('/', roadmapController.getRoadmap);

export default router;
