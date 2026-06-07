import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import * as ctrl from '../controllers/activity.controller.js';

const router = Router();
router.use(protect);
router.post('/', ctrl.trackEvent);
export default router;
