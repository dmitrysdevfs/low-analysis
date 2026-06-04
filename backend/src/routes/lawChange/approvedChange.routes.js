import express from 'express';
import * as approvedChangeController from '../../controllers/lawChange/approvedChange.controller.js';
import {
  protect,
  hasPermission,
  authorize,
} from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/law-change/laws/{id}/view:
 *   get:
 *     summary: Get law with elements, approved changes and active proposals
 *     tags: [LawChange]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 */
router.get(
  '/laws/:id/view',
  protect,
  hasPermission('law_changes:read'),
  approvedChangeController.getLawView,
);

/**
 * @swagger
 * /api/law-change/approved:
 *   get:
 *     summary: Get approved changes for a law (query: law_id)
 *     tags: [LawChange]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/approved',
  protect,
  hasPermission('law_changes:read'),
  approvedChangeController.getApprovedChanges,
);

/**
 * @swagger
 * /api/law-change/approved/feed:
 *   get:
 *     summary: Paginated feed of approved changes (page, limit)
 *     tags: [LawChange]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/approved/feed',
  protect,
  hasPermission('law_changes:read'),
  approvedChangeController.getChangeFeed,
);

/**
 * @swagger
 * /api/law-change/approved/{id}/rollback:
 *   post:
 *     summary: Rollback an approved change (admin only)
 *     tags: [LawChange]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/approved/:id/rollback',
  protect,
  authorize('admin'),
  approvedChangeController.rollbackChange,
);

/**
 * @swagger
 * /api/law-change/approved/{id}/archive:
 *   post:
 *     summary: Archive an approved change (admin only)
 *     tags: [LawChange]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/approved/:id/archive',
  protect,
  authorize('admin'),
  approvedChangeController.archiveChange,
);

export default router;
