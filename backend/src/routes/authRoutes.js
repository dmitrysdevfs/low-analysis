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
  verifyEmail,
  resendVerification,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { guestRateLimit } from '../middleware/guestRateLimit.js';

const router = express.Router();

// 1 resend per 60 seconds per IP
const _resendStore = new Map();
function resendRateLimit(req, res, next) {
  if (process.env.NODE_ENV === 'test') return next();
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  const now = Date.now();
  const WINDOW = 60 * 1000;
  const entry = _resendStore.get(ip) ?? { ts: 0 };
  if (now - entry.ts < WINDOW) {
    const retryAfter = Math.ceil((entry.ts + WINDOW - now) / 1000);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({
      message: 'Зачекайте перед повторною відправкою',
      retryAfterSeconds: retryAfter,
    });
  }
  _resendStore.set(ip, { ts: now });
  return next();
}

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

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Start password reset flow
 *     description: Accepts an email address and sends reset instructions if the account exists. The response is intentionally generic.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Reset flow accepted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: If this email exists, a reset link was sent.
 *       400:
 *         description: Email is missing
 *       429:
 *         description: Too many reset attempts from the same IP
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/forgot-password', passwordResetRateLimit, forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with emailed token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *                 example: 9c493f790d3f4f53f56b1f8abf0f6f1d
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: NewSecurePass1!
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset successfully
 *       400:
 *         description: Missing token/password, weak password or expired token
 *       429:
 *         description: Too many reset attempts from the same IP
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/reset-password', passwordResetRateLimit, resetPassword);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Login or register with Google access token
 *     description: Uses Google userinfo endpoint to resolve identity and returns the platform JWT.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accessToken]
 *             properties:
 *               accessToken:
 *                 type: string
 *                 example: ya29.a0AfH6SMD-example
 *     responses:
 *       200:
 *         description: Successful Google authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokenResponse'
 *       400:
 *         description: Access token is missing
 *       401:
 *         description: Invalid Google token
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/google', guestRateLimit, googleAuth);

router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendRateLimit, resendVerification);

export default router;
