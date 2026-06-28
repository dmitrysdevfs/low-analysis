import express from 'express';
import * as inviteController from '../controllers/invite.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/invites/:token — public: get invite info
router.get('/:token', inviteController.getInviteInfo);

// POST /api/invites/:token/join — auth required: existing user joins
router.post('/:token/join', protect, inviteController.joinByInvite);

// POST /api/invites/:token/register — public: new user registers + auto-joins
router.post('/:token/register', inviteController.registerAndJoin);

export default router;
