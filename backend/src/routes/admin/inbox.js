import { Router } from 'express';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import * as ctrl from '../../controllers/admin/inbox.controller.js';

const router = Router();

router.get('/connect/callback', ctrl.completeConnect);

router.use(protect, authorize('admin'));
router.get('/status', ctrl.getStatus);
router.post('/connect/start', ctrl.startConnect);
router.post('/disconnect', ctrl.disconnect);
router.post('/sync', ctrl.syncInbox);
router.get('/threads', ctrl.listThreads);
router.get('/threads/:id', ctrl.getThread);
router.post('/threads/:id/read', ctrl.markRead);
router.post('/threads/:id/reply', ctrl.reply);

export default router;
