import { Router } from 'express';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import * as ctrl from '../../controllers/admin/superCode.controller.js';

const router = Router();
router.use(protect, authorize('admin'));

/**
 * @swagger
 * /api/admin/super-code:
 *   get:
 *     summary: Отримати поточний суперкод адміна
 *     description: Одноразовий код для екстреного входу або скидання. Видимий тільки адміну.
 *     tags: [AdminSuperCode]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Суперкод
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: string }
 *                 createdAt: { type: string, format: date-time }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', ctrl.getSuperCode);

/**
 * @swagger
 * /api/admin/super-code/rotate:
 *   post:
 *     summary: Згенерувати новий суперкод
 *     description: Інвалідує поточний код і генерує новий. Використовується при підозрі на компрометацію.
 *     tags: [AdminSuperCode]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Новий суперкод
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: string }
 *                 createdAt: { type: string, format: date-time }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/rotate', ctrl.rotateSuperCode);
export default router;
