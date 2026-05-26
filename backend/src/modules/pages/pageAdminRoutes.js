import express from 'express';
import * as pageController from './page.controller.js';
import { authorize, protect } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

/**
 * @swagger
 * /api/admin/pages/{slug}:
 *   get:
 *     summary: Отримати draft/published стан сторінки для адмінки
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *           example: project-info
 *     responses:
 *       200:
 *         description: Адмін-модель сторінки
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ManagedPageAdmin'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/:slug', pageController.getAdminPage);

/**
 * @swagger
 * /api/admin/pages/{slug}:
 *   put:
 *     summary: Зберегти draft сторінки
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *           example: project-info
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ManagedPageSnapshot'
 *     responses:
 *       200:
 *         description: Оновлений admin-представлення сторінки
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ManagedPageAdmin'
 *       400:
 *         description: Некоректний payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put('/:slug', pageController.saveDraftPage);

/**
 * @swagger
 * /api/admin/pages/{slug}/publish:
 *   post:
 *     summary: Опублікувати поточний draft
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *           example: project-info
 *     responses:
 *       200:
 *         description: Сторінка опублікована
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ManagedPageAdmin'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/:slug/publish', pageController.publishPage);

/**
 * @swagger
 * /api/admin/pages/{slug}/unpublish:
 *   post:
 *     summary: Зняти сторінку з публікації
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *           example: project-info
 *     responses:
 *       200:
 *         description: Сторінка переведена у draft-only режим
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ManagedPageAdmin'
 */
router.post('/:slug/unpublish', pageController.unpublishPage);

/**
 * @swagger
 * /api/admin/pages/{slug}/versions:
 *   get:
 *     summary: Історія версій сторінки
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *           example: project-info
 *     responses:
 *       200:
 *         description: Перелік доступних snapshot-ів
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ManagedPageVersionMeta'
 */
router.get('/:slug/versions', pageController.getPageVersions);

/**
 * @swagger
 * /api/admin/pages/{slug}/restore/{version}:
 *   post:
 *     summary: Відновити одну з попередніх версій у draft
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *           example: project-info
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: integer
 *           example: 3
 *     responses:
 *       200:
 *         description: Draft відновлено з обраної версії
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ManagedPageAdmin'
 *       404:
 *         description: Версію не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:slug/restore/:version', pageController.restorePageVersion);

export default router;
