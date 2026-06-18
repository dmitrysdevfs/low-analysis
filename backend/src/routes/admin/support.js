import { Router } from 'express';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import * as ctrl from '../../modules/support/support.admin.controller.js';

const router = Router();
router.use(protect, authorize('admin'));

/**
 * @swagger
 * /api/admin/support/status:
 *   get:
 *     summary: Статус підтримки (KPI + Telegram)
 *     description: Загальна кількість діалогів, відкриті, непрочитані, стан Telegram-каналу.
 *     tags: [AdminSupport]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KPI підтримки
 */
router.get('/status', ctrl.getStatus);

/**
 * @swagger
 * /api/admin/support/sync-check:
 *   post:
 *     summary: Перевірити з'єднання з Telegram-ботом
 *     description: Надсилає test ping до Telegram Bot API та повертає latency і статус webhook.
 *     tags: [AdminSupport]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Результат перевірки
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 *                 botUsername: { type: string }
 *                 latencyMs: { type: integer }
 *                 webhookStatus: { type: string, enum: [ok, degraded, down] }
 */
router.post('/sync-check', ctrl.syncCheck);

/**
 * @swagger
 * /api/admin/support/conversations:
 *   get:
 *     summary: Список діалогів підтримки
 *     description: Пагінований список з фільтром за статусом та пошуком по клієнту.
 *     tags: [AdminSupport]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [open, waiting_support, waiting_user, closed] }
 *       - in: query
 *         name: query
 *         schema: { type: string }
 *         description: Пошук за ім'ям або email клієнта
 *     responses:
 *       200:
 *         description: Список діалогів
 */
router.get('/conversations', ctrl.listConversations);

/**
 * @swagger
 * /api/admin/support/conversations/{id}:
 *   get:
 *     summary: Отримати діалог з повною стрічкою повідомлень
 *     tags: [AdminSupport]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Діалог і повідомлення
 */
router.get('/conversations/:id', ctrl.getConversation);

/**
 * @swagger
 * /api/admin/support/conversations/{id}/read:
 *   post:
 *     summary: Позначити діалог як прочитаний адміном
 *     tags: [AdminSupport]
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
router.post('/conversations/:id/read', ctrl.markConversationRead);

/**
 * @swagger
 * /api/admin/support/conversations/{id}/messages:
 *   post:
 *     summary: Надіслати відповідь клієнту
 *     description: Адмін надсилає повідомлення у тред. Якщо Telegram налаштований — доставляє туди.
 *     tags: [AdminSupport]
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
 *             required: [text]
 *             properties:
 *               text: { type: string }
 *     responses:
 *       200:
 *         description: Повідомлення надіслано
 */
router.post('/conversations/:id/messages', ctrl.postMessage);

/**
 * @swagger
 * /api/admin/support/conversations/{id}/status:
 *   post:
 *     summary: Змінити статус діалогу
 *     tags: [AdminSupport]
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
 *               status: { type: string, enum: [open, waiting_support, waiting_user, closed] }
 *     responses:
 *       200:
 *         description: Статус змінено
 */
router.post('/conversations/:id/status', ctrl.updateStatus);

/**
 * @swagger
 * /api/admin/support/conversations/{id}/assign:
 *   post:
 *     summary: Призначити діалог адміну
 *     tags: [AdminSupport]
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
 *               adminId: { type: string, description: "'me' або MongoDB ObjectId адміна" }
 *     responses:
 *       200:
 *         description: Призначено
 */
router.post('/conversations/:id/assign', ctrl.assignConversation);

/**
 * @swagger
 * /api/admin/support/conversations/{id}/spam:
 *   post:
 *     summary: Позначити діалог як спам
 *     tags: [AdminSupport]
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
router.post('/conversations/:id/spam', ctrl.markAsSpam);

/**
 * @swagger
 * /api/admin/support/conversations/{id}/escalate:
 *   post:
 *     summary: Ескалювати діалог (пріоритет → urgent)
 *     tags: [AdminSupport]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ескальовано
 */
router.post('/conversations/:id/escalate', ctrl.escalateConversation);

/**
 * @swagger
 * /api/admin/support/conversations/{id}/notes:
 *   get:
 *     summary: Список внутрішніх нотаток до діалогу
 *     tags: [AdminSupport]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Нотатки
 *   post:
 *     summary: Додати внутрішню нотатку до діалогу
 *     description: Нотатки видимі лише адмінам, клієнт їх не бачить.
 *     tags: [AdminSupport]
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
 *             required: [text]
 *             properties:
 *               text: { type: string }
 *     responses:
 *       201:
 *         description: Нотатку збережено
 */
router.get('/conversations/:id/notes', ctrl.listNotes);
router.post('/conversations/:id/notes', ctrl.addNote);

export default router;
