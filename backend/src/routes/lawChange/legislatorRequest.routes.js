import express from 'express';
import * as legislatorRequestController from '../../controllers/lawChange/legislatorRequest.controller.js';
import { protect, authorize } from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/law-change/legislator-requests:
 *   post:
 *     summary: Submit a legislator access request (auth users)
 *     tags: [LawChange]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [organization, reason]
 *             properties:
 *               organization: { type: string }
 *               reason: { type: string }
 *   get:
 *     summary: Get all access requests (admin only)
 *     tags: [LawChange]
 *     security:
 *       - bearerAuth: []
 */
router
  .route('/')
  .post(protect, legislatorRequestController.submitRequest)
  .get(protect, authorize('admin'), legislatorRequestController.getAllRequests);

/**
 * @swagger
 * /api/law-change/legislator-requests/my:
 *   get:
 *     summary: Get my legislator access request
 *     tags: [LawChange]
 *     security:
 *       - bearerAuth: []
 */
router.get('/my', protect, legislatorRequestController.getMyRequest);

/**
 * @swagger
 * /api/law-change/legislator-requests/revoke:
 *   post:
 *     summary: Revoke own role (returns to user)
 *     tags: [LawChange]
 *     security:
 *       - bearerAuth: []
 */
router.post('/revoke', protect, legislatorRequestController.revokeRole);

/**
 * @swagger
 * /api/law-change/legislator-requests/{id}/approve:
 *   post:
 *     summary: Approve legislator request and set user role to legislator (admin)
 *     tags: [LawChange]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/approve',
  protect,
  authorize('admin'),
  legislatorRequestController.approveRequest,
);

/**
 * @swagger
 * /api/law-change/legislator-requests/{id}/reject:
 *   post:
 *     summary: Reject legislator request (admin)
 *     tags: [LawChange]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/reject',
  protect,
  authorize('admin'),
  legislatorRequestController.rejectRequest,
);

export default router;
