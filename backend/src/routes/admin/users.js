import { Router } from 'express';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import * as ctrl from '../../controllers/admin/users.controller.js';

const router = Router();
router.use(protect, authorize('admin'));
router.get('/', ctrl.listUsers);
router.patch('/:id/status', ctrl.setStatus);
router.patch('/:id/role', ctrl.setRole);
router.patch('/:id/billing', ctrl.setBilling);
router.post('/:id/force-logout', ctrl.forceLogout);
export default router;
