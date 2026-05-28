import express from 'express';
import * as exportController from '../controllers/exportController.js';

const router = express.Router();

/**
 * @swagger
 * /api/laws/export:
 *   get:
 *     tags: [Laws]
 *     summary: Експорт структурованого датасету закону (CSV / JSON)
 *     description: |
 *       Дозволяє вивантажити повний масив текстових елементів закону (абзаців, частин, пунктів) у вигляді датасету для подальшого аналізу в сторонніх засобах (MS Excel, Python, R тощо).
 *       
 *       Підтримуються два формати:
 *       1. **CSV** (з вбудованим UTF-8 BOM для безпроблемного відкриття в Excel без кракозябр). Рядки стрімяться частинами (streaming) для запобігання перевантаженню пам'яті.
 *       2. **JSON** (pretty-printed із форматизованими відступами для зручного читання).
 *       
 *       Також підтримується фільтрація за конкретним суб'єктом регулювання.
 *     parameters:
 *       - in: query
 *         name: lawId
 *         required: true
 *         schema:
 *           type: string
 *           example: 69f84aa7395f1789bc7b2b89
 *         description: MongoDB ID закону, дані якого потрібно експортувати
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Формат вихідного файлу
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [flat, nested]
 *           default: flat
 *         description: Структура даних (flat — плаский список абзаців з інформацією про предків, nested — деревоподібна структура закону. Працює тільки для format=json)
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *           example: громадянин
 *         description: Фільтр за назвою або ID суб'єкта. Дозволяє експортувати лише елементи, які регулюють обраного суб'єкта
 *     responses:
 *       200:
 *         description: Файл успішно сформовано та віддано для завантаження
 *         headers:
 *           Content-Type:
 *             schema:
 *               type: string
 *               example: text/csv; charset=utf-8
 *           Content-Disposition:
 *             schema:
 *               type: string
 *               example: attachment; filename="dataset-69f84aa7395f1789bc7b2b89.csv"
 *           X-Accel-Buffering:
 *             schema:
 *               type: string
 *               example: no
 *             description: Вимикає буферизацію Nginx для стрімінгу CSV
 *       400:
 *         description: Невалідний запит (наприклад, відсутній обов'язковий lawId)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Параметр lawId є обов’язковим для експорту."
 *       404:
 *         description: Закон із вказаним ID не знайдено в базі даних
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Law not found with ID: 69f84aa7395f1789bc7b2b89"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * 
 * /api/export/dataset:
 *   get:
 *     tags: [Laws]
 *     summary: Аліас для експорту структурованого датасету закону (CSV / JSON)
 *     description: Повністю дублює поведінку маршруту `/api/laws/export`. Призначений для зручності виклику з зовнішніх аналітичних систем.
 *     parameters:
 *       - in: query
 *         name: lawId
 *         required: true
 *         schema:
 *           type: string
 *           example: 69f84aa7395f1789bc7b2b89
 *         description: MongoDB ID закону, дані якого потрібно експортувати
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Формат вихідного файлу
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [flat, nested]
 *           default: flat
 *         description: Структура даних (flat — плаский список абзаців, nested — деревоподібна структура)
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *           example: громадянин
 *         description: Фільтр за назвою або ID суб'єкта
 *     responses:
 *       200:
 *         description: Файл успішно сформовано та віддано
 *       400:
 *         description: Невалідний запит
 *       404:
 *         description: Закон не знайдено
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', exportController.exportDataset);

export default router;
