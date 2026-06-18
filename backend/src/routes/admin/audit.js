import { Router } from 'express';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import * as ctrl from '../../controllers/admin/audit.controller.js';

const router = Router();
router.use(protect, authorize('admin'));

/**
 * @swagger
 * /api/admin/audit/overview:
 *   get:
 *     summary: Агрегована статистика аудит-лога
 *     description: Повертає кількість подій за типами, топ акторів та останні критичні події.
 *     tags: [AdminAudit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статистика аудиту
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/overview', ctrl.getAuditOverview);

/**
 * @swagger
 * /api/admin/audit:
 *   get:
 *     summary: Список операційних подій (аудит-лог)
 *     description: Пагінований список усіх аудит-записів з фільтрами за типом, severity та актором.
 *     tags: [AdminAudit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: actor
 *         schema: { type: string }
 *         description: Фільтр за email актора
 *       - in: query
 *         name: severity
 *         schema: { type: string, enum: [info, warning, error, security] }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *         description: Тип події (user_login, role_change, etc.)
 *     responses:
 *       200:
 *         description: Список аудит-записів
 *   post:
 *     summary: Додати запис до аудит-лога
 *     description: Внутрішній endpoint для ручного створення аудит-запису.
 *     tags: [AdminAudit]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, actor]
 *             properties:
 *               type: { type: string }
 *               actor: { type: string }
 *               severity: { type: string, enum: [info, warning, error, security] }
 *               meta: { type: object }
 *     responses:
 *       201:
 *         description: Запис створено
 */
router.get('/', ctrl.getAuditLog);
router.post('/', ctrl.appendAuditEntry);

export default router;
