import { Router } from 'express';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import { assignPlan } from '../../controllers/billingController.js';

const router = Router();

router.use(protect, authorize('admin'));
router.post('/:userId/assign', assignPlan);

export default router;
