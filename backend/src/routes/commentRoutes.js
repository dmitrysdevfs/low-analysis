import express from 'express';
import * as commentController from '../controllers/commentController.js';
import { protect, hasPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Додати новий коментар
 *     description: Дозволяє користувачу з дозволом `comments:create` прокоментувати поправку або законопроєкт.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [target_type, target_id, text]
 *             properties:
 *               target_type:
 *                 type: string
 *                 enum: [amendment, proposal]
 *                 example: 'amendment'
 *               target_id:
 *                 type: string
 *                 example: '507f1f77bcf86cd799439066'
 *               text:
 *                 type: string
 *                 example: 'Повністю згоден із цим уточненням.'
 *     responses:
 *       201:
 *         description: Коментар успішно додано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   get:
 *     summary: Отримати список коментарів
 *     description: Завантажує коментарі, відфільтровані за `targetType` та `targetId`.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: targetType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [amendment, proposal]
 *         description: Тип об'єкта коментування
 *       - in: query
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID об'єкта коментування (Amendment або Proposal)
 *     responses:
 *       200:
 *         description: Список коментарів
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router
  .route('/')
  .post(protect, hasPermission('comments:create'), commentController.addComment)
  .get(protect, hasPermission('comments:read'), commentController.getComments);

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Видалити коментар
 *     description: Дозволяє користувачу видалити власний коментар за його ID.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID коментаря
 *     responses:
 *       200:
 *         description: Коментар видалено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Comment deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Недостатньо прав (видалити коментар може тільки його автор)
 *       404:
 *         description: Коментар не знайдено
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete(
  '/:id',
  protect,
  hasPermission('comments:create'),
  commentController.deleteComment,
);

export default router;
