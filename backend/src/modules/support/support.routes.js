import { Router } from 'express';
import * as ctrl from './support.controller.js';
import { optionalSupportAuth } from './support.optional-auth.js';

const router = Router();

router.get('/config', ctrl.getConfig);
router.post('/telegram/webhook', ctrl.handleTelegramWebhook);

router.use(optionalSupportAuth);
router.get('/conversations/current', ctrl.getCurrentConversation);
router.post('/conversations/message', ctrl.postMessage);
router.post('/conversations/:id/read', ctrl.markConversationRead);

export default router;
