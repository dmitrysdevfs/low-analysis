import { Router } from 'express';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import * as ctrl from '../../modules/support/support.admin.controller.js';

const router = Router();

router.use(protect, authorize('admin'));
router.get('/status', ctrl.getStatus);
router.get('/conversations', ctrl.listConversations);
router.get('/conversations/:id', ctrl.getConversation);
router.post('/conversations/:id/read', ctrl.markConversationRead);
router.post('/conversations/:id/messages', ctrl.postMessage);
router.post('/conversations/:id/status', ctrl.updateStatus);

export default router;
