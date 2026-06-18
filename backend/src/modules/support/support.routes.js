import { Router } from 'express';
import * as ctrl from './support.controller.js';
import { optionalSupportAuth } from './support.optional-auth.js';

const router = Router();

/**
 * @swagger
 * /api/support/config:
 *   get:
 *     summary: Конфігурація чату підтримки для клієнта
 *     description: >
 *       Публічний endpoint. Повертає налаштування чату: чи увімкнено Telegram-бот,
 *       привітальне повідомлення, офлайн-текст, кнопки швидких відповідей.
 *     tags: [Support]
 *     responses:
 *       200:
 *         description: Конфігурація чату
 */
router.get('/config', ctrl.getConfig);

/**
 * @swagger
 * /api/support/telegram/webhook:
 *   post:
 *     summary: Telegram Bot webhook
 *     description: >
 *       Внутрішній endpoint для Telegram Bot API. Отримує оновлення від Telegram
 *       і перенаправляє повідомлення у відповідний діалог підтримки.
 *       Захищений підписом Telegram (secret token header).
 *     tags: [Support]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Telegram Update object
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/telegram/webhook', ctrl.handleTelegramWebhook);

router.use(optionalSupportAuth);

/**
 * @swagger
 * /api/support/conversations/current:
 *   get:
 *     summary: Поточний діалог клієнта
 *     description: >
 *       Повертає активний діалог для поточного користувача (авторизованого або анонімного).
 *       Анонімна ідентифікація за sessionId cookie.
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     responses:
 *       200:
 *         description: Поточний діалог або null
 */
router.get('/conversations/current', ctrl.getCurrentConversation);

/**
 * @swagger
 * /api/support/conversations/message:
 *   post:
 *     summary: Надіслати повідомлення в підтримку
 *     description: >
 *       Клієнт надсилає текстове повідомлення. Якщо активного діалогу немає — створюється новий.
 *       Анонімні сесії ідентифікуються за sessionId cookie.
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *       - {}
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
router.post('/conversations/message', ctrl.postMessage);

/**
 * @swagger
 * /api/support/conversations/{id}/read:
 *   post:
 *     summary: Позначити діалог як прочитаний клієнтом
 *     description: Скидає лічильник непрочитаних для клієнта після відкриття чату.
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *       - {}
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

export default router;
