import { Router } from 'express';
import { protect } from '../../middleware/authMiddleware.js';
import {
  enqueueParseLaw,
  enqueueAnalyzeSubjects,
  enqueueBatchUpdateLawTree,
  getJobStatus,
} from './queue.controller.js';

const router = Router();

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Queue
 *   description: Фонова обробка через чергу (BullMQ + Redis)
 */

/**
 * @swagger
 * /api/queue/parse-law:
 *   post:
 *     summary: Поставити закон у чергу на парсинг
 *     description: >
 *       Кладе job парсингу в чергу й одразу повертає jobId (202 Accepted).
 *       Сам парсинг виконується фоновим воркером. Прогрес/результат — через
 *       GET /api/queue/status/{jobId}.
 *     tags: [Queue]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url]
 *             properties:
 *               url:
 *                 type: string
 *                 description: URL закону на zakon.rada.gov.ua або його код
 *                 example: "580-19"
 *     responses:
 *       202:
 *         description: Job прийнято в чергу
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                   example: "parse_law-3f9a1c2e-9b4f-4c21-a8d1-1e2f3a4b5c6d"
 *                 queue:
 *                   type: string
 *                   example: parse_law
 *                 state:
 *                   type: string
 *                   example: queued
 *       400:
 *         description: Не передано url
 */
router.post('/parse-law', enqueueParseLaw);

/**
 * @swagger
 * /api/queue/analyze-subjects:
 *   post:
 *     summary: Поставити закон у чергу на аналіз суб'єктів
 *     description: >
 *       Кладе job batch-аналізу суб'єктів (SRL/LLM) у чергу й одразу повертає
 *       jobId (202 Accepted). Сам аналіз — довга фонова операція, виконується
 *       воркером. Прогрес/результат — через GET /api/queue/status/{jobId}.
 *     tags: [Queue]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lawId]
 *             properties:
 *               lawId:
 *                 type: string
 *                 description: MongoDB ObjectId закону
 *                 example: "665b1f2d6671c86dc22d27b0"
 *               force:
 *                 type: boolean
 *                 description: >
 *                   Перерахувати елементи, що вже мають subjects[].
 *                   За замовчуванням false — аналізуються лише ще не оброблені.
 *                 default: false
 *     responses:
 *       202:
 *         description: Job прийнято в чергу
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                   example: "analyze_subjects-7b1d2c3e-4f5a-6b7c-8d9e-0a1b2c3d4e5f"
 *                 queue:
 *                   type: string
 *                   example: analyze_subjects
 *                 state:
 *                   type: string
 *                   example: queued
 *       400:
 *         description: Не передано lawId
 */
router.post('/analyze-subjects', enqueueAnalyzeSubjects);

/**
 * @swagger
 * /api/queue/batch-update-law-tree:
 *   post:
 *     summary: Поставити масове оновлення дерев законів у чергу
 *     description: >
 *       Кладе job масового re-ingest у чергу й одразу повертає jobId
 *       (202 Accepted). Воркер для кожного коду заново фетчить і парсить закон
 *       з zakon.rada.gov.ua та оновлює дерево елементів (idempotent upsert +
 *       видалення відсутніх). Помилка по окремому коду не валить увесь job —
 *       вона потрапляє у failed/results. Прогрес/результат — через
 *       GET /api/queue/status/{jobId}.
 *     tags: [Queue]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [codes]
 *             properties:
 *               codes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Коди законів на zakon.rada.gov.ua (або їх URL)
 *                 example: ["254к/96-вр", "580-19"]
 *     responses:
 *       202:
 *         description: Job прийнято в чергу
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                   example: "batch_update_law_tree-99e0a1b2-c3d4-5e6f-7a8b-9c0d1e2f3a4b"
 *                 queue:
 *                   type: string
 *                   example: batch_update_law_tree
 *                 state:
 *                   type: string
 *                   example: queued
 *       400:
 *         description: codes не передано або порожній/не масив
 */
router.post('/batch-update-law-tree', enqueueBatchUpdateLawTree);

/**
 * @swagger
 * /api/queue/status/{jobId}:
 *   get:
 *     summary: Перевірити статус job
 *     description: >
 *       Повертає поточний стан job у його життєвому циклі, прогрес,
 *       кількість спроб і — після завершення — результат або причину помилки.
 *     tags: [Queue]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Ідентифікатор job, отриманий при постановці в чергу
 *     responses:
 *       200:
 *         description: Статус job
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                   example: "parse_law-3f9a1c2e-9b4f-4c21-a8d1-1e2f3a4b5c6d"
 *                 queue:
 *                   type: string
 *                   example: parse_law
 *                 state:
 *                   type: string
 *                   enum: [waiting, active, completed, failed, delayed]
 *                   example: completed
 *                 progress:
 *                   type: number
 *                   example: 100
 *                 attemptsMade:
 *                   type: number
 *                   example: 1
 *                 returnvalue:
 *                   type: object
 *                   nullable: true
 *                   example: { lawId: "665...", elementsCount: 1301 }
 *                 failedReason:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *       404:
 *         description: Job не знайдено
 */
router.get('/status/:jobId', getJobStatus);

export default router;
