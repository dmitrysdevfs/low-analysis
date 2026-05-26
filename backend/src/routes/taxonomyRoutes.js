import express from 'express';
import * as taxonomyController from '../controllers/taxonomyController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/taxonomies:
 *   get:
 *     summary: Список усіх категорій таксономії
 *     tags: [Taxonomy]
 *     responses:
 *       200:
 *         description: Масив категорій
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Taxonomy'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', taxonomyController.getAllTaxonomies);

/**
 * @swagger
 * /api/taxonomies/tree:
 *   get:
 *     summary: Ієрархія таксономії як дерево
 *     tags: [Taxonomy]
 *     responses:
 *       200:
 *         description: Масив кореневих вузлів з дочірніми елементами
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TaxonomyTreeNode'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/tree', taxonomyController.getTaxonomyTree);

/**
 * @swagger
 * /api/taxonomies/analyze/{lawId}:
 *   post:
 *     summary: Класифікувати всі елементи закону за таксономією
 *     description: Запускає rule-based класифікацію для кожного елемента закону. Тільки для адміністраторів.
 *     tags: [Taxonomy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lawId
 *         required: true
 *         schema:
 *           type: string
 *           example: '507f1f77bcf86cd799439011'
 *         description: MongoDB ObjectId закону
 *     responses:
 *       200:
 *         description: Результат класифікації
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Taxonomy analysis complete
 *                 lawId:
 *                   type: string
 *                 processed:
 *                   type: integer
 *                   example: 850
 *                 skipped:
 *                   type: integer
 *                   example: 144
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Закон не знайдено
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/analyze/:lawId',
  protect,
  authorize(['admin']),
  taxonomyController.analyzeLaw,
);

export default router;
