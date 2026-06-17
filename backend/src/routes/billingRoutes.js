import { Router } from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import * as billingController from '../controllers/billingController.js';

const router = Router();

router.get('/plans', billingController.getPlans);
router.get('/me', protect, billingController.getMyBilling);
router.post('/consume', protect, billingController.consumeQuota);
router.post('/checkout/demo', protect, billingController.checkoutDemo);
router.post(
  '/admin/:userId/assign',
  protect,
  authorize('admin'),
  billingController.assignPlan,
);

export default router;
