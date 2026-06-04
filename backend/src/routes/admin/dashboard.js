import { Router } from 'express';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import { getDashboard } from '../../controllers/admin/dashboard.controller.js';

const router = Router();
router.use(protect, authorize('admin'));
router.get('/', getDashboard);
export default router;
