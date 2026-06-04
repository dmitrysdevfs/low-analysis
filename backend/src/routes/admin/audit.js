import { Router } from 'express';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import * as ctrl from '../../controllers/admin/audit.controller.js';

const router = Router();
router.use(protect, authorize('admin'));
router.get('/', ctrl.getAuditLog);
router.post('/', ctrl.appendAuditEntry);
export default router;
