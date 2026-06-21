import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  logoutUser,
  updateUserProfile,
  updateUserPassword,
  forgotPassword,
  resetPassword,
  googleAuth,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { guestRateLimit } from '../middleware/guestRateLimit.js';

const router = express.Router();

// 5 attempts per 15 minutes per IP for password-reset endpoints
const _pwdResetStore = new Map();
function passwordResetRateLimit(req, res, next) {
  if (process.env.NODE_ENV === 'test') return next();
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  const now = Date.now();
  const WINDOW = 15 * 60 * 1000;
  const MAX = 5;
  let entry = _pwdResetStore.get(ip) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW);
  if (entry.timestamps.length >= MAX) {
    const retryAfter = Math.ceil((entry.timestamps[0] + WINDOW - now) / 1000);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({
      message: 'Забагато спроб. Спробуйте через 15 хвилин.',
      retryAfterSeconds: retryAfter,
    });
  }
  entry.timestamps.push(now);
  _pwdResetStore.set(ip, entry);
  return next();
}

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Реєстрація нового користувача
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             client:
 *               summary: Звичайний користувач
 *               value:
 *                 email: user@example.com
 *                 password: SecurePass1!
 *                 displayName: Іван Петренко
 *             admin:
 *               summary: Адміністратор (потребує superCode)
 *               value:
 *                 email: admin@example.com
 *                 password: AdminPass1!
 *                 displayName: Адмін
 *                 accountType: admin
 *                 superCode: YOUR_SUPER_CODE
 *     responses:
 *       201:
 *         description: Користувач успішно зареєстрований
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokenResponse'
 *       400:
 *         description: Користувач вже існує або невалідні дані
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               exists:
 *                 value:
 *                   message: User already exists
 *               badSuperCode:
 *                 value:
 *                   message: Недійсний супер-код для реєстрації адміністратора
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/register', guestRateLimit, registerUser);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вхід в систему
 *     description: Приймає email або username + пароль. Повертає JWT токен.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: user@example.com
 *             password: SecurePass1!
 *     responses:
 *       200:
 *         description: Успішний вхід
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokenResponse'
 *       401:
 *         description: Невірний email або пароль
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Invalid email or password
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/login', guestRateLimit, loginUser);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Отримати профіль поточного користувача
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профіль користувача
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Користувача не знайдено
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/me', protect, getUserProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Оновити ім'я користувача
 *     description: Приймає displayName або fullName — обидва варіанти рівнозначні.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *           example:
 *             displayName: Нове Ім'я
 *     responses:
 *       200:
 *         description: Профіль оновлено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Користувача не знайдено
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/profile', protect, updateUserProfile);

/**
 * @swagger
 * /api/auth/password:
 *   put:
 *     summary: Змінити пароль
 *     description: Перевіряє поточний пароль та встановлює новий. Мінімум 8 символів.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePasswordRequest'
 *     responses:
 *       200:
 *         description: Пароль змінено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password updated successfully
 *       400:
 *         description: Невірний поточний пароль або новий пароль замалий
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               wrongCurrent:
 *                 value:
 *                   message: Current password is incorrect
 *               tooShort:
 *                 value:
 *                   message: Password must be at least 8 characters
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Користувача не знайдено
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/password', protect, updateUserPassword);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Вийти з системи
 *     description: JWT-токен зберігається на клієнті — клієнт повинен видалити його локально. Серверний виклик є опціональним.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Успішний вихід
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 */
router.post('/logout', logoutUser);

router.post('/forgot-password', passwordResetRateLimit, forgotPassword);
router.post('/reset-password', passwordResetRateLimit, resetPassword);
router.post('/google', guestRateLimit, googleAuth);

export default router;
