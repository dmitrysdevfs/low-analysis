import express from 'express';
import {
  getAllLaws,
  getLawTree,
  getLawStats,
  getLawStatsBulk,
  getArticle,
  getLawArticles,
  parseLawFromUrl,
  getElement,
  getLawHeatmap,
  getLawSubjects,
} from '../controllers/lawController.js';
import { guestRateLimit } from '../middleware/guestRateLimit.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply guest rate limiting to all law routes
router.use(guestRateLimit);

/**
 * @swagger
 * /api/laws:
 *   get:
 *     tags: [Laws]
 *     summary: Список всіх законів
 *     description: Повертає масив законів з підтримкою пошуку, фільтрації та сортування
 *     parameters:
 *       - in: query
 *         name: q
 *         required: false
 *         description: Пошуковий рядок (регістронезалежний)
 *         schema:
 *           type: string
 *           example: конституція
 *       - in: query
 *         name: wordField
 *         required: false
 *         description: Поле для пошуку за ключовим словом (title — назва, text — преамбула, code — код)
 *         schema:
 *           type: string
 *           enum: [title, text, code]
 *           default: title
 *       - in: query
 *         name: status
 *         required: false
 *         description: Фільтр за станом документа (регістронезалежний)
 *         schema:
 *           type: string
 *           example: Чинний
 *       - in: query
 *         name: documentType
 *         required: false
 *         description: Фільтр за типом документа — точний збіг з одним з елементів масиву (регістронезалежний)
 *         schema:
 *           type: string
 *           example: Закон України
 *       - in: query
 *         name: number
 *         required: false
 *         description: Фільтр за кодом/номером акта (працює разом з numberType)
 *         schema:
 *           type: string
 *           example: 889-19
 *       - in: query
 *         name: numberType
 *         required: false
 *         description: Режим зіставлення для number — починається з / містить / точний збіг
 *         schema:
 *           type: string
 *           enum: [starts, contains, exact]
 *           default: starts
 *       - in: query
 *         name: subjectId
 *         required: false
 *         description: Фільтр законів за суб'єктом регулювання (ObjectId суб'єкта з /api/subjects/search)
 *         schema:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *       - in: query
 *         name: dateFrom
 *         required: false
 *         description: Фільтр за датою прийняття — від (включно)
 *         schema:
 *           type: string
 *           format: date
 *           example: '2020-01-01'
 *       - in: query
 *         name: dateTo
 *         required: false
 *         description: Фільтр за датою прийняття — до (включно, до кінця дня)
 *         schema:
 *           type: string
 *           format: date
 *           example: '2023-12-31'
 *       - in: query
 *         name: sortBy
 *         required: false
 *         description: Поле сортування
 *         schema:
 *           type: string
 *           enum: [date, title]
 *           default: date
 *       - in: query
 *         name: sortOrder
 *         required: false
 *         description: Напрямок сортування
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: page
 *         required: false
 *         description: Номер сторінки (починаючи з 1)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Кількість результатів на сторінку (максимум 500)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 500
 *           default: 20
 *           example: 20
 *     responses:
 *       200:
 *         description: Пагінований список законів
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedLaws'
 *       400:
 *         description: Невалідні параметри запиту
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidSortBy:
 *                 summary: Невалідний sortBy
 *                 value:
 *                   message: 'Invalid sortBy value. Allowed: date, title'
 *               invalidDateFrom:
 *                 summary: Невалідна дата
 *                 value:
 *                   message: 'Invalid dateFrom value. Expected ISO date (e.g. 2020-01-01)'
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
 *     description: Повертає закон разом із плоским масивом усіх його елементів (розділи, статті, частини, пункти, підпункти, абзаци). Клієнт будує ієрархію самостійно за полями parentId та depth. Підтримує фільтрацію за функцією, доменом та суб'єктом.
 *     parameters:
 *       - $ref: '#/components/parameters/LawId'
 *       - in: query
 *         name: function
 *         required: false
 *         schema:
 *           type: string
 *         description: Фільтрація за типом норми (right, obligation тощо)
 *       - in: query
 *         name: domain
 *         required: false
 *         schema:
 *           type: string
 *         description: Фільтрація за доменом (labor, finance тощо)
 *       - in: query
 *         name: subjectId
 *         required: false
 *         schema:
 *           type: string
 *         description: Фільтрація за ID суб'єкта регулювання
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
 * /api/laws/{id}/articles:
 *   get:
 *     tags: [Laws]
 *     summary: Структура статей закону
 *     description: Повертає метадані закону та впорядкований список його статей (номер + назва)
 *     parameters:
 *       - $ref: '#/components/parameters/LawId'
 *     responses:
 *       200:
 *         description: Метадані закону зі списком статей
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LawStructure'
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
router.get('/:id/articles', getLawArticles);

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
 * /api/laws/{id}/heatmap:
 *   get:
 *     tags: [Laws]
 *     summary: Дані для теплової карти закону
 *     parameters:
 *       - $ref: '#/components/parameters/LawId'
 *     responses:
 *       200:
 *         description: Список елементів для візуалізації складності
 */
router.get('/:id/heatmap', getLawHeatmap);

/**
 * @swagger
 * /api/laws/elements/{id}:
 *   get:
 *     tags: [Elements]
 *     summary: Отримати конкретний елемент за ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Елемент знайдено
 */
router.get('/elements/:id', getElement);

/**
 * @swagger
 * /api/laws/{id}/subjects:
 *   get:
 *     tags: [Laws]
 *     summary: Get subject distribution for a law
 *     description: Returns regulatory subjects and per-subject counters scoped to the selected law.
 *     parameters:
 *       - $ref: '#/components/parameters/LawId'
 *     responses:
 *       200:
 *         description: Subject statistics for the law
 *       404:
 *         description: Law not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id/subjects', getLawSubjects);

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
router.post('/parse', protect, authorize('admin'), parseLawFromUrl);

/**
 * @swagger
 * /api/laws/stats-bulk:
 *   post:
 *     summary: Масова статистика законів (bulk)
 *     description: >
 *       Одним MongoDB aggregation-запитом повертає статистику для масиву lawId.
 *       Замінює N окремих GET /api/laws/:id/stats викликів.
 *     tags: [Laws]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: Об'єкт з ключами lawId → LawStats
 *       400:
 *         description: ids array is required
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/stats-bulk', protect, authorize('admin'), getLawStatsBulk);

export default router;
