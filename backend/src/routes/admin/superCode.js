import { Router } from 'express';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import * as ctrl from '../../controllers/admin/superCode.controller.js';

const router = Router();
router.use(protect, authorize('admin'));
router.get('/', ctrl.getSuperCode);
router.post('/rotate', ctrl.rotateSuperCode);
export default router;
