import { Router } from 'express';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import { getDashboard } from '../../controllers/admin/dashboard.controller.js';

const router = Router();
router.use(protect, authorize('admin'));

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Головний дашборд адмін-панелі
 *     description: >
 *       Повертає ключові метрики платформи: кількість користувачів, законів,
 *       активних сесій AI-помічника, непрочитаних звернень підтримки,
 *       останні аудит-події та стан черги парсингу.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Метрики дашборду
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usersTotal: { type: integer }
 *                 usersActive: { type: integer }
 *                 lawsTotal: { type: integer }
 *                 supportUnread: { type: integer }
 *                 assistantSessions: { type: integer }
 *                 recentAudit: { type: array, items: { type: object } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', getDashboard);

export default router;
