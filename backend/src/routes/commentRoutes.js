import express from 'express';
import * as commentController from '../controllers/commentController.js';
import { protect, hasPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

router
  .route('/')
  .post(protect, hasPermission('comments:create'), commentController.addComment)
  .get(protect, hasPermission('comments:read'), commentController.getComments);

router.delete(
  '/:id',
  protect,
  hasPermission('comments:create'),
  commentController.deleteComment,
);

export default router;
