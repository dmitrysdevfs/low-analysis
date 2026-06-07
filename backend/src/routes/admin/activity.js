import { Router } from 'express';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import * as ctrl from '../../controllers/admin/activity.controller.js';

const router = Router();
router.use(protect, authorize('admin'));
router.get('/:userId', ctrl.getUserActivity);
export default router;
