import express from 'express';
import {
  getAllSubjects,
  getSubjectElements,
  analyzeElementHandler,
  analyzeBatchHandler,
} from '../controllers/subjectController.js';

const router = express.Router();

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/subjects:
 *   get:
 *     tags: [Subjects]
 *     summary: Список суб'єктів регулювання
 *     description: >
 *       Повертає глобальний реєстр суб'єктів з полями elements_count та laws_count.
 *       Сортування: за кількістю згадувань (elements_count desc), потім законів (laws_count desc),
 *       потім за назвою (canonical_name asc).
 *     responses:
 *       200:
 *         description: Масив суб'єктів
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Subject'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', getAllSubjects);

/**
 * @swagger
 * /api/subjects/{id}/elements:
 *   get:
 *     tags: [Subjects]
 *     summary: Елементи пов'язані із суб'єктом
 *     description: Повертає суб'єкта разом із усіма елементами законів, де він фігурує.
 *     parameters:
 *       - $ref: '#/components/parameters/SubjectId'
 *     responses:
 *       200:
 *         description: Суб'єкт із пов'язаними елементами
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubjectElements'
 *       404:
 *         description: Суб'єкт не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Subject not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id/elements', getSubjectElements);

// ── LLM Analysis ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/subjects/analyze/{elementId}:
 *   post:
 *     tags: [Subjects]
 *     summary: Визначити суб'єктів для елемента
 *     description: >
 *       Запускає Semantic Role Labeling через LLM (Gemini Flash) для одного елемента закону.
 *       Ідемпотентна операція — повторний виклик перезаписує попередній результат.
 *       Елементи без текстового вмісту (розділи, статті-заголовки) пропускаються.
 *     parameters:
 *       - in: path
 *         name: elementId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId елемента
 *     responses:
 *       200:
 *         description: Результат аналізу
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 elementId:
 *                   type: string
 *                 subjectsFound:
 *                   type: integer
 *                 subjects:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       subject_id:
 *                         type: string
 *                       role:
 *                         type: string
 *                 raw:
 *                   type: array
 *                   description: Сирі дані від LLM (до нормалізації)
 *       404:
 *         description: Елемент не знайдено
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/analyze/:elementId', analyzeElementHandler);

/**
 * @swagger
 * /api/subjects/analyze-batch/{lawId}:
 *   post:
 *     tags: [Subjects]
 *     summary: Batch-аналіз суб'єктів для цілого закону
 *     description: >
 *       Послідовно аналізує всі листові елементи закону (paragraph, point, sub_point).
 *       Підтримує параметри force та delay для управління поведінкою.
 *     parameters:
 *       - in: path
 *         name: lawId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId закону
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Якщо true — переаналізовує елементи, що вже мають subjects[]
 *       - in: query
 *         name: delay
 *         schema:
 *           type: integer
 *           default: 500
 *         description: Затримка між LLM-запитами у мілісекундах (rate limiting)
 *     responses:
 *       200:
 *         description: Статистика batch-аналізу
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 lawId:
 *                   type: string
 *                 processed:
 *                   type: integer
 *                 subjectsFound:
 *                   type: integer
 *                 skipped:
 *                   type: integer
 *                 errors:
 *                   type: integer
 *       404:
 *         description: Закон не знайдено
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/analyze-batch/:lawId', analyzeBatchHandler);

export default router;
