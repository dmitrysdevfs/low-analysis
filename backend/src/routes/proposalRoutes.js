import express from 'express';
import * as proposalController from '../controllers/proposalController.js';
import { protect, hasPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/proposals:
 *   post:
 *     summary: Створити новий законопроєкт (Proposal)
 *     description: Дозволяє зареєстрованому користувачу з дозволом `proposals:create` (роль legislator або admin) створити новий законопроєкт.
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [law_id, title]
 *             properties:
 *               law_id:
 *                 type: string
 *                 example: '69f84aa7395f1789bc7b2b89'
 *               title:
 *                 type: string
 *                 example: 'Пакет пропозицій щодо покращення Конституції України'
 *               description:
 *                 type: string
 *                 example: 'Пропонується реформувати систему судоустрою...'
 *     responses:
 *       201:
 *         description: Законопроєкт створено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Proposal'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   get:
 *     summary: Отримати список законопроєктів
 *     description: Дозволяє переглянути список законопроєктів із можливістю фільтрації за `lawId` або `userId`.
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Список законопроєктів
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Proposal'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router
  .route('/')
  .post(
    protect,
    hasPermission('proposals:create'),
    proposalController.createProposal,
  )
  .get(protect, hasPermission('laws:read'), proposalController.getProposals);

/**
 * @swagger
 * /api/proposals/{id}:
 *   get:
 *     summary: Отримати деталі законопроєкту за ID
 *     description: Завантажує метадані законопроєкту та всі пов'язані з ним поправки (Amendments).
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID законопроєкту
 *     responses:
 *       200:
 *         description: Деталі законопроєкту
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 proposal:
 *                   $ref: '#/components/schemas/Proposal'
 *                 amendments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Amendment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Законопроєкт не знайдено
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   patch:
 *     summary: Оновити законопроєкт
 *     description: Дозволяє автору законопроєкту (поки статус draft) змінити його назву чи опис.
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID законопроєкту
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: 'Нова назва законопроєкту'
 *               description:
 *                 type: string
 *                 example: 'Новий детальний опис...'
 *     responses:
 *       200:
 *         description: Законопроєкт оновлено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Proposal'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Редагування дозволено тільки автору в статусі draft
 *       404:
 *         description: Законопроєкт не знайдено
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router
  .route('/:id')
  .get(protect, hasPermission('laws:read'), proposalController.getProposalById)
  .patch(
    protect,
    hasPermission('proposals:create'),
    proposalController.updateProposal,
  );

/**
 * @swagger
 * /api/proposals/{id}/submit:
 *   post:
 *     summary: Подати законопроєкт на перегляд (Submit for review)
 *     description: Змінює статус законопроєкту з draft на review. Доступно лише автору.
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID законопроєкту
 *     responses:
 *       200:
 *         description: Статус оновлено на review
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Proposal'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Подати на ревю може тільки автор у статусі draft
 *       404:
 *         description: Законопроєкт не знайдено
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/:id/submit',
  protect,
  hasPermission('proposals:submit'),
  proposalController.submitProposal,
);

/**
 * @swagger
 * /api/proposals/{id}/document:
 *   get:
 *     summary: Згенерувати фінальний документ законопроєкту (JSON)
 *     description: Повертає структурований JSON законопроєкту, що містить оригінальний закон, перелік поправок та їхнє розташування.
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID законопроєкту
 *     responses:
 *       200:
 *         description: Структурований JSON законопроєкту
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Законопроєкт не знайдено
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/:id/document',
  protect,
  hasPermission('laws:read'),
  proposalController.generateDocument,
);

export default router;
