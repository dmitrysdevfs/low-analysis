import express from 'express';
import * as exportController from '../controllers/exportController.js';

const router = express.Router();

/**
 * @swagger
 * /api/laws/export:
 *   get:
 *     summary: Експорт структурованого датасету закону для зовнішнього аналізу
 *     description: Дозволяє завантажити дані конкретного закону (елементи, текст, суб'єкти, Z-score, ризики) у форматі CSV або JSON.
 *     tags: [Export]
 *     parameters:
 *       - in: query
 *         name: lawId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID закону в базі даних MongoDB
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Формат вихідного файлу (json або csv для Excel)
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [flat, nested]
 *           default: flat
 *         description: Структура даних (flat — пласка таблиця, nested — вкладене дерево; актуально тільки для format=json)
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *         description: Опціональний фільтр за назвою або ID суб'єкта регулювання
 *     responses:
 *       200:
 *         description: Файл завантажено успішно
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *               example: attachment; filename="dataset-12345.csv"
 *       400:
 *         description: Невірні параметри запиту (відсутній lawId)
 *       444:
 *         description: Помилка сервера
 */
router.get('/', exportController.exportDataset);

export default router;
