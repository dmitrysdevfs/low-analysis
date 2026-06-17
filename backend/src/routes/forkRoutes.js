import { Router } from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import * as forkController from '../controllers/forkController.js';

const router = Router();
router.use(protect);
router.use(authorize('legislator', 'supervisor', 'admin'));

router.get('/me', forkController.getMyForks);
router.get('/law/:lawId', forkController.getLawForks);
router.post('/', forkController.createFork);
router.get('/:id', forkController.getFork);
router.post('/:id/changes', forkController.addChange);
router.post('/:id/submit', forkController.submitFork);
router.get('/:id/diff', forkController.getForkDiff);

export default router;
