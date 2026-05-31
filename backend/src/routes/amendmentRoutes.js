import express from 'express';
import * as amendmentController from '../controllers/amendmentController.js';
import { protect, hasPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

router
  .route('/')
  .post(protect, hasPermission('amendments:create'), amendmentController.createAmendment)
  .get(protect, hasPermission('laws:read'), amendmentController.getAmendments);

router
  .route('/:id')
  .get(protect, hasPermission('laws:read'), amendmentController.getAmendmentById)
  .patch(protect, hasPermission('amendments:edit'), amendmentController.updateAmendment)
  .delete(protect, hasPermission('amendments:delete'), amendmentController.deleteAmendment);

export default router;
