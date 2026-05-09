import express from 'express';
import {
  getAllSubjects,
  getSubjectElements,
} from '../controllers/subjectController.js';

const router = express.Router();

/**
 * @swagger
 * /api/subjects:
 *   get:
 *     tags: [Subjects]
 *     summary: Список суб'єктів регулювання
 *     description: Повертає всіх суб'єктів (студент, лікар, підприємець тощо) збережених у базі
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
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getAllSubjects);

/**
 * @swagger
 * /api/subjects/{id}/elements:
 *   get:
 *     tags: [Subjects]
 *     summary: Елементи пов'язані із суб'єктом
 *     description: Повертає суб'єкта разом із масивом елементів законів, що його регулюють
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
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/elements', getSubjectElements);

export default router;
