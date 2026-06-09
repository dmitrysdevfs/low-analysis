import { Router } from 'express';
import {
  enqueueParseLaw,
  enqueueAnalyzeSubjects,
  getJobStatus,
} from './queue.controller.js';

const router = Router();

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
 *                   example: "42"
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
 *                   example: "43"
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
 *                   example: "42"
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
