import express from 'express';
import { search } from '../controllers/searchController.js';
import { guestRateLimit } from '../middleware/guestRateLimit.js';

const router = express.Router();

router.use(guestRateLimit);

/**
 * @swagger
 * /api/search:
 *   get:
 *     tags: [Search]
 *     summary: Повнотекстовий пошук по законах та статтях
 *     description: >
 *       Шукає за назвою закону, назвою та текстом статей, а також номером статті.
 *       Повертає плоский список результатів зі snippet та типом збігу, відсортований
 *       за релевантністю (назва закону > назва статті > текст статті).
 *       Існуючий `GET /api/laws` лишається як backward-compatible пошук по назві закону.
 *       Потрібен хоча б один із параметрів `q` або `subjectId`.
 *     parameters:
 *       - in: query
 *         name: q
 *         required: false
 *         description: Пошуковий рядок (мінімум 1 символ). Необов'язковий, якщо задано subjectId
 *         schema:
 *           type: string
 *           example: податок
 *       - in: query
 *         name: subjectId
 *         required: false
 *         description: >
 *           Жорсткий фільтр по суб'єкту регулювання (id з GET /api/subjects/search).
 *           Обмежує результати статтями/законами, де згадується цей суб'єкт.
 *         schema:
 *           type: string
 *           example: 507f1f77bcf86cd799439022
 *       - in: query
 *         name: type
 *         required: false
 *         description: Область пошуку — лише закони, лише статті, або все
 *         schema:
 *           type: string
 *           enum: [law, article, all]
 *           default: all
 *       - in: query
 *         name: status
 *         required: false
 *         description: Фільтр за станом закону (регістронезалежний, точний збіг)
 *         schema:
 *           type: string
 *           example: Чинний
 *       - in: query
 *         name: dateFrom
 *         required: false
 *         description: Фільтр за датою прийняття закону — від (включно)
 *         schema:
 *           type: string
 *           format: date
 *           example: '2020-01-01'
 *       - in: query
 *         name: dateTo
 *         required: false
 *         description: Фільтр за датою прийняття закону — до (включно, до кінця дня)
 *         schema:
 *           type: string
 *           format: date
 *           example: '2023-12-31'
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Пагінований список результатів пошуку
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SearchResults'
 *       400:
 *         description: Невалідні параметри запиту
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: 'q: q or subjectId is required'
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', search);

export default router;
