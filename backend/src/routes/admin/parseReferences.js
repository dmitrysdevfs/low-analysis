import { Router } from 'express';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import {
  parseAllReferences,
  parseSingleLawReferences,
} from '../../controllers/admin/parseReferences.controller.js';

const router = Router();
router.use(protect, authorize('admin'));

router.post('/all', parseAllReferences);
router.post('/law/:lawId', parseSingleLawReferences);

export default router;
