import { Router } from 'express';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import {
  parseAllReferences,
  parseSingleLawReferences,
} from '../../controllers/admin/parseReferences.controller.js';

const router = Router();
router.use(protect, authorize('admin'));

/**
 * @swagger
 * /api/admin/parse-references/all:
 *   post:
 *     summary: Parse and rebuild references for all laws
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated parsing result for all laws
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 laws: { type: integer }
 *                 totalParsed: { type: integer }
 *                 totalCreated: { type: integer }
 *                 totalUpdated: { type: integer }
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/all', parseAllReferences);

/**
 * @swagger
 * /api/admin/parse-references/law/{lawId}:
 *   post:
 *     summary: Parse references for one law
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lawId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Parsing result for a single law
 *       400:
 *         description: Invalid lawId
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/law/:lawId', parseSingleLawReferences);

export default router;
