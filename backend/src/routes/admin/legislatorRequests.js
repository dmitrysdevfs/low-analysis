import { Router } from 'express';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import { patchLegislatorRequest } from '../../controllers/admin/legislatorRequests.controller.js';

const router = Router();
router.use(protect, authorize('admin'));
router.patch('/:id', patchLegislatorRequest);
export default router;
