import { Router } from 'express';
import {
  getConfig,
  getSuggestions,
  streamChat,
  submitFeedback,
  getSessions,
  getSession,
  deleteSession,
  getQuotaStatus,
} from './assistant.controller.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = Router();

/**
 * @swagger
 * /api/assistant/config:
 *   get:
 *     summary: Конфігурація AI-помічника
 *     description: Повертає поточний режим роботи (stub/llm) та прапор увімкнення. Використовується фронтендом для умовного рендеру.
 *     tags: [Assistant]
 *     responses:
 *       200:
 *         description: Конфіг успішно отримано
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enabled:
 *                   type: boolean
 *                   example: true
 *                 mode:
 *                   type: string
 *                   enum: [stub, llm]
 *                   example: stub
 */
router.get('/config', getConfig);

/**
 * @swagger
 * /api/assistant/suggestions:
 *   get:
 *     summary: Підказки для початку діалогу
 *     description: Повертає список готових питань для відображення у порожньому чаті.
 *     tags: [Assistant]
 *     responses:
 *       200:
 *         description: Масив підказок
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "Як знайти закон за назвою?"
 *                     - "Що означає червоний ризик?"
 */
router.get('/suggestions', getSuggestions);

/**
 * @swagger
 * /api/assistant/chat/stream:
 *   post:
 *     summary: Стримінг відповіді AI (SSE)
 *     description: |
 *       Приймає повідомлення користувача і повертає відповідь через Server-Sent Events.
 *       Авторизація опціональна: гості обмежені по IP (5 запитів/день), авторизовані — по userId.
 *
 *       **Формат SSE-подій** (`data: <JSON>\n\n`):
 *       - `{ type: "token", content: "фрагмент тексту" }` — токен відповіді
 *       - `{ type: "done", sources: [...] }` — кінець потоку, масив джерел
 *       - `{ type: "session", sessionId: "...", title: "..." }` — ID збереженої сесії
 *       - `{ type: "limit", used, limit, resetAt, message }` — квота вичерпана
 *       - `{ type: "error", message: "..." }` — помилка
 *     tags: [Assistant]
 *     security:
 *       - {}
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 2000
 *                 example: "Як знайти закон за назвою?"
 *               sessionId:
 *                 type: string
 *                 description: MongoDB ObjectId існуючої сесії (якщо є)
 *                 example: "507f1f77bcf86cd799439011"
 *               mode:
 *                 type: string
 *                 enum: [general, law, article]
 *                 default: general
 *               contextLawId:
 *                 type: string
 *                 description: ID закону з поточної сторінки
 *               contextArticleNum:
 *                 type: string
 *                 description: Номер статті з поточної сторінки
 *               planId:
 *                 type: string
 *                 description: ID тарифного плану для серверної перевірки квоти
 *     responses:
 *       200:
 *         description: SSE-потік відповіді
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       400:
 *         description: Невалідне або порожнє повідомлення
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: AI-помічник вимкнено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/chat/stream',
  (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return protect(req, res, () => next());
    }
    next();
  },
  streamChat,
);

/**
 * @swagger
 * /api/assistant/feedback:
 *   post:
 *     summary: Оцінити відповідь AI
 *     description: Зберігає оцінку (👍/👎) до конкретного повідомлення у сесії. Авторизація опціональна.
 *     tags: [Assistant]
 *     security:
 *       - {}
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - messageId
 *               - feedback
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               messageId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439022"
 *               feedback:
 *                 type: integer
 *                 enum: [1, -1]
 *                 description: "1 = корисна відповідь, -1 = некорисна"
 *                 example: 1
 *     responses:
 *       200:
 *         description: Оцінку збережено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Невалідний payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Сесія або повідомлення не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/feedback',
  (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return protect(req, res, () => next());
    }
    next();
  },
  submitFeedback,
);

/**
 * @swagger
 * /api/assistant/quota:
 *   get:
 *     summary: Поточний стан квоти AI-запитів
 *     description: Повертає кількість використаних і доступних запитів для поточного користувача або IP. Авторизація опціональна.
 *     tags: [Assistant]
 *     security:
 *       - {}
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: planId
 *         schema:
 *           type: string
 *           enum: [trial, user, plus, pro]
 *         description: ID тарифного плану для розрахунку ліміту
 *     responses:
 *       200:
 *         description: Стан квоти
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allowed:
 *                   type: boolean
 *                   example: true
 *                 used:
 *                   type: integer
 *                   nullable: true
 *                   example: 3
 *                 limit:
 *                   type: integer
 *                   nullable: true
 *                   example: 50
 *                 resetAt:
 *                   type: integer
 *                   description: Unix timestamp скидання лічильника
 *                   example: 1716854400000
 */
router.get(
  '/quota',
  (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return protect(req, res, () => next());
    }
    next();
  },
  getQuotaStatus,
);

/**
 * @swagger
 * /api/assistant/sessions:
 *   get:
 *     summary: Список сесій користувача
 *     description: Повертає до 50 останніх сесій авторизованого користувача, відсортованих за датою оновлення.
 *     tags: [Assistant]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Масив мета-даних сесій
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   messageCount:
 *                     type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/sessions', protect, getSessions);

/**
 * @swagger
 * /api/assistant/sessions/{id}:
 *   get:
 *     summary: Повна сесія з повідомленнями
 *     description: Повертає конкретну сесію з повним масивом повідомлень, джерелами та оцінками.
 *     tags: [Assistant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId сесії
 *     responses:
 *       200:
 *         description: Повна сесія
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       role:
 *                         type: string
 *                         enum: [user, assistant]
 *                       content:
 *                         type: string
 *                       feedback:
 *                         type: integer
 *                         nullable: true
 *                       sources:
 *                         type: array
 *                         items:
 *                           type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Сесію не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/sessions/:id', protect, getSession);

/**
 * @swagger
 * /api/assistant/sessions/{id}:
 *   delete:
 *     summary: Видалити сесію
 *     description: Остаточно видаляє сесію разом з усіма повідомленнями. Дозволено лише власнику сесії.
 *     tags: [Assistant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId сесії
 *     responses:
 *       200:
 *         description: Сесію видалено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Сесію не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/sessions/:id', protect, deleteSession);

export default router;
