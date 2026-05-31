import express from 'express';
import * as amendmentController from '../controllers/amendmentController.js';
import { protect, hasPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/amendments:
 *   post:
 *     summary: Створити нову поправку (Amendment)
 *     description: Дозволяє законотворцю запропонувати зміну (редагування, додавання або видалення) для конкретного елемента закону.
 *     tags: [Amendments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [law_id, element_id, change_type]
 *             properties:
 *               law_id:
 *                 type: string
 *                 example: '69f84aa7395f1789bc7b2b89'
 *               element_id:
 *                 type: string
 *                 example: '69f84aa7395f1789bc7b2b8a'
 *               proposal_id:
 *                 type: string
 *                 example: '507f1f77bcf86cd799439055'
 *               change_type:
 *                 type: string
 *                 enum: [edit, add, delete]
 *                 example: 'edit'
 *               proposed_text:
 *                 type: string
 *                 example: 'Новий текст закону для цього абзацу'
 *               reason:
 *                 type: string
 *                 example: 'Уточнення формулювання для усунення корупційних ризиків'
 *     responses:
 *       201:
 *         description: Поправку створено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Amendment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   get:
 *     summary: Отримати список поправок
 *     description: Завантажує список поправок із можливістю фільтрації за `proposalId`, `lawId` або `userId`.
 *     tags: [Amendments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: proposalId
 *         schema:
 *           type: string
 *         description: Фільтрація за ID законопроєкту
 *       - in: query
 *         name: lawId
 *         schema:
 *           type: string
 *         description: Фільтрація за ID закону
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Фільтрація за ID автора
 *     responses:
 *       200:
 *         description: Список поправок
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Amendment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router
  .route('/')
  .post(
    protect,
    hasPermission('amendments:create'),
    amendmentController.createAmendment,
  )
  .get(protect, hasPermission('laws:read'), amendmentController.getAmendments);

/**
 * @swagger
 * /api/amendments/{id}:
 *   get:
 *     summary: Отримати поправку за ID
 *     description: Завантажує повні дані поправки за її ідентифікатором.
 *     tags: [Amendments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID поправки
 *     responses:
 *       200:
 *         description: Деталі поправки
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Amendment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Поправку не знайдено
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   patch:
 *     summary: Оновити поправку
 *     description: Дозволяє автору поправки змінити пропонований текст або обґрунтування (поки законопроєкт у статусі draft).
 *     tags: [Amendments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID поправки
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               proposed_text:
 *                 type: string
 *                 example: 'Оновлений пропонований текст'
 *               reason:
 *                 type: string
 *                 example: 'Оновлене обґрунтування...'
 *     responses:
 *       200:
 *         description: Поправку оновлено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Amendment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Редагування дозволено тільки автору в статусі draft
 *       404:
 *         description: Поправку не знайдено
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   delete:
 *     summary: Видалити поправку
 *     description: Дозволяє автору видалити поправку (поки законопроєкт у статусі draft).
 *     tags: [Amendments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID поправки
 *     responses:
 *       200:
 *         description: Поправку видалено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Amendment deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Видалення дозволено тільки автору в статусі draft
 *       404:
 *         description: Поправку не знайдено
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router
  .route('/:id')
  .get(
    protect,
    hasPermission('laws:read'),
    amendmentController.getAmendmentById,
  )
  .patch(
    protect,
    hasPermission('amendments:edit'),
    amendmentController.updateAmendment,
  )
  .delete(
    protect,
    hasPermission('amendments:delete'),
    amendmentController.deleteAmendment,
  );

export default router;
