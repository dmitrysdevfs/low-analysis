import express from 'express';
import {
  getAllLaws,
  getLawTree,
  getLawStats,
  getArticle,
  parseLawFromUrl,
} from '../controllers/lawController.js';

const router = express.Router();

/**
 * @swagger
 * /api/laws:
 *   get:
 *     tags: [Laws]
 *     summary: Список всіх законів
 *     description: Повертає масив усіх законів збережених у базі даних
 *     parameters:
 *       - in: query
 *         name: q
 *         required: false
 *         description: Пошуковий рядок (пошук по назві закону, регістронезалежний)
 *         schema:
 *           type: string
 *           example: конституція
 *     responses:
 *       200:
 *         description: Масив законів (відфільтрований якщо переданий q)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Law'
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getAllLaws);

/**
 * @swagger
 * /api/laws/{id}/tree:
 *   get:
 *     tags: [Laws]
 *     summary: Дерево елементів закону
 *     description: Повертає закон разом із плоским масивом усіх його елементів (розділи, статті, частини, пункти, підпункти, абзаци). Клієнт будує ієрархію самостійно за полями parentId та depth.
 *     parameters:
 *       - $ref: '#/components/parameters/LawId'
 *     responses:
 *       200:
 *         description: Закон із деревом елементів
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LawTree'
 *       404:
 *         description: Закон не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Law not found
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/tree', getLawTree);

/**
 * @swagger
 * /api/laws/{id}/stats:
 *   get:
 *     tags: [Laws]
 *     summary: Загальна статистика закону
 *     description: Повертає загальну статистику закону (кількість елементів, середню кількість символів, стандартне відхилення та розподіл за рівнями ризику)
 *     parameters:
 *       - $ref: '#/components/parameters/LawId'
 *     responses:
 *       200:
 *         description: Статистика закону
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LawStats'
 *       404:
 *         description: Статистика не знайдена
 *       500:
 *         description: Помилка сервера
 */
router.get('/:id/stats', getLawStats);

/**
 * @swagger
 * /api/laws/{id}/articles/{num}:
 *   get:
 *     tags: [Laws]
 *     summary: Стаття з дочірніми елементами
 *     description: Повертає конкретну статтю закону разом із її частинами, підпунктами та абзацами
 *     parameters:
 *       - $ref: '#/components/parameters/LawId'
 *       - $ref: '#/components/parameters/ArticleNum'
 *     responses:
 *       200:
 *         description: Стаття з дочірніми елементами
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 *       404:
 *         description: Стаття не знайдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Article not found
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/articles/:num', getArticle);

/**
 * @swagger
 * /api/laws/parse:
 *   post:
 *     tags: [Laws]
 *     summary: Розпарсити закон за посиланням
 *     description: Завантажує HTML закону з zakon.rada.gov.ua, парсить його та зберігає в базу даних.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 example: "https://zakon.rada.gov.ua/laws/show/580-19"
 *                 description: Посилання на закон або його код
 *     responses:
 *       200:
 *         description: Успішно розпарсено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 lawId:
 *                   type: string
 *                 elementsCount:
 *                   type: integer
 *       400:
 *         description: Невірний URL
 *       500:
 *         description: Помилка сервера або парсингу
 */
router.post('/parse', parseLawFromUrl);

export default router;
