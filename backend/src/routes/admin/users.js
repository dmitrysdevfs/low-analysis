import { Router } from 'express';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import * as ctrl from '../../controllers/admin/users.controller.js';

const router = Router();
router.use(protect, authorize('admin'));

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Список усіх користувачів платформи
 *     description: Повертає пагінований список користувачів з фільтрами за роллю та статусом.
 *     tags: [AdminUsers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Номер сторінки
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *         description: Кількість елементів на сторінці
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [user, paid_user, legislator, admin] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive] }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Пошук за email або ім'ям
 *     responses:
 *       200:
 *         description: Список користувачів
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', ctrl.listUsers);

/**
 * @swagger
 * /api/admin/users/{id}/overview:
 *   get:
 *     summary: Огляд профілю користувача (білінг, активність, ролі)
 *     tags: [AdminUsers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Розширений огляд профілю
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Користувача не знайдено
 */
router.get('/:id/overview', ctrl.getOverview);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Отримати користувача за ID
 *     tags: [AdminUsers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Дані користувача
 *       404:
 *         description: Не знайдено
 */
router.get('/:id', ctrl.getUser);

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   patch:
 *     summary: Змінити статус користувача (active / inactive)
 *     tags: [AdminUsers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: Статус оновлено
 */
router.patch('/:id/status', ctrl.setStatus);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   patch:
 *     summary: Призначити роль користувачу
 *     tags: [AdminUsers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [user, paid_user, legislator, admin] }
 *     responses:
 *       200:
 *         description: Роль оновлено
 */
router.patch('/:id/role', ctrl.setRole);

/**
 * @swagger
 * /api/admin/users/{id}/billing:
 *   patch:
 *     summary: Оновити білінгові дані користувача
 *     tags: [AdminUsers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plan: { type: string }
 *               expiresAt: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Білінг оновлено
 */
router.patch('/:id/billing', ctrl.setBilling);

/**
 * @swagger
 * /api/admin/users/{id}/force-logout:
 *   post:
 *     summary: Примусово завершити сесію користувача
 *     tags: [AdminUsers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Сесія завершена
 */
router.post('/:id/force-logout', ctrl.forceLogout);

export default router;
