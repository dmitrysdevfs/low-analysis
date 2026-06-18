import { Router } from 'express';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import * as ctrl from '../../controllers/admin/inbox.controller.js';

const router = Router();

/**
 * @swagger
 * /api/admin/inbox/connect/callback:
 *   get:
 *     summary: OAuth callback для підключення Gmail
 *     description: Публічний endpoint — Google redirect після OAuth. Не потребує токена.
 *     tags: [AdminInbox]
 *     responses:
 *       302:
 *         description: Редирект до адмін-панелі після підключення
 */
router.get('/connect/callback', ctrl.completeConnect);

router.use(protect, authorize('admin'));

/**
 * @swagger
 * /api/admin/inbox/status:
 *   get:
 *     summary: Статус підключення Gmail Inbox
 *     description: Чи підключено Gmail, кількість непрочитаних тредів, дата останньої синхронізації.
 *     tags: [AdminInbox]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статус inbox
 */
router.get('/status', ctrl.getStatus);

/**
 * @swagger
 * /api/admin/inbox/connect/start:
 *   post:
 *     summary: Розпочати OAuth підключення Gmail
 *     tags: [AdminInbox]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: URL для OAuth авторизації Google
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authUrl: { type: string }
 */
router.post('/connect/start', ctrl.startConnect);

/**
 * @swagger
 * /api/admin/inbox/disconnect:
 *   post:
 *     summary: Відключити Gmail Inbox
 *     tags: [AdminInbox]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Gmail відключено
 */
router.post('/disconnect', ctrl.disconnect);

/**
 * @swagger
 * /api/admin/inbox/sync:
 *   post:
 *     summary: Примусова синхронізація Gmail тредів
 *     tags: [AdminInbox]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Синхронізацію виконано
 */
router.post('/sync', ctrl.syncInbox);

/**
 * @swagger
 * /api/admin/inbox/threads:
 *   get:
 *     summary: Список Gmail тредів
 *     description: Повертає треди з inbox, відсортовані за датою останнього повідомлення.
 *     tags: [AdminInbox]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: unread
 *         schema: { type: boolean }
 *         description: Фільтр тільки непрочитаних
 *     responses:
 *       200:
 *         description: Список тредів
 */
router.get('/threads', ctrl.listThreads);

/**
 * @swagger
 * /api/admin/inbox/threads/{id}:
 *   get:
 *     summary: Отримати тред з повними повідомленнями
 *     tags: [AdminInbox]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Тред і повідомлення
 */
router.get('/threads/:id', ctrl.getThread);

/**
 * @swagger
 * /api/admin/inbox/threads/{id}/read:
 *   post:
 *     summary: Позначити тред як прочитаний
 *     tags: [AdminInbox]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Позначено
 */
router.post('/threads/:id/read', ctrl.markRead);

/**
 * @swagger
 * /api/admin/inbox/threads/{id}/reply:
 *   post:
 *     summary: Відповісти на Gmail тред
 *     tags: [AdminInbox]
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
 *             required: [body]
 *             properties:
 *               body: { type: string, description: HTML або plain text відповіді }
 *     responses:
 *       200:
 *         description: Відповідь надіслано
 */
router.post('/threads/:id/reply', ctrl.reply);

export default router;
