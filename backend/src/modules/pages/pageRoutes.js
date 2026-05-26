import express from 'express';
import * as pageController from './page.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/pages:
 *   get:
 *     summary: Доступні керовані сторінки
 *     tags: [Pages]
 *     responses:
 *       200:
 *         description: Перелік підтримуваних slug-ів
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   slug:
 *                     type: string
 *                     example: project-info
 *                   label:
 *                     type: string
 *                     example: Інформація про проєкт
 */
router.get('/', pageController.getPageCatalog);

/**
 * @swagger
 * /api/pages/{slug}:
 *   get:
 *     summary: Публічна сторінка з block-based конфігом
 *     tags: [Pages]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *           example: project-info
 *     responses:
 *       200:
 *         description: Опублікована сторінка
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ManagedPagePublic'
 *       404:
 *         description: Опубліковану сторінку не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:slug', pageController.getPublicPage);

export default router;
