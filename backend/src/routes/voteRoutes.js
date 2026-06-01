import express from 'express';
import * as voteController from '../controllers/voteController.js';
import { protect, hasPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/votes:
 *   post:
 *     summary: Проголосувати за поправку (Cast vote)
 *     description: Дозволяє користувачу проголосувати за поправку (у разі повторного виклику голос оновлюється).
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amendment_id, value]
 *             properties:
 *               amendment_id:
 *                 type: string
 *                 example: '507f1f77bcf86cd799439066'
 *               value:
 *                 type: string
 *                 enum: [positive, neutral, negative]
 *                 example: 'positive'
 *     responses:
 *       200:
 *         description: Голос успішно враховано
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vote cast successfully
 *                 vote:
 *                   $ref: '#/components/schemas/Vote'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', protect, hasPermission('votes:cast'), voteController.castVote);

/**
 * @swagger
 * /api/votes/summary/{amendmentId}:
 *   get:
 *     summary: Отримати статистику голосів за поправку
 *     description: Завантажує агреговані результати голосування (кількість positive, neutral, negative) для поправки.
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: amendmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID поправки
 *     responses:
 *       200:
 *         description: Статистика голосів
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 positive:
 *                   type: integer
 *                   example: 10
 *                 neutral:
 *                   type: integer
 *                   example: 2
 *                 negative:
 *                   type: integer
 *                   example: 1
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/summary/:amendmentId',
  protect,
  hasPermission('laws:read'),
  voteController.getVoteSummary,
);

/**
 * @swagger
 * /api/votes/my/{amendmentId}:
 *   get:
 *     summary: Отримати мій голос за поправку
 *     description: Повертає значення голосу поточного авторизованого користувача за вказану поправку (якщо голос відсутній, повертає null).
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: amendmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID поправки
 *     responses:
 *       200:
 *         description: Мій голос
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 value:
 *                   type: string
 *                   enum: [positive, neutral, negative]
 *                   example: 'positive'
 *                   nullable: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/my/:amendmentId',
  protect,
  hasPermission('votes:cast'),
  voteController.getUserVote,
);

export default router;
