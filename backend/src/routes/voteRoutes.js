import express from 'express';
import * as voteController from '../controllers/voteController.js';
import { protect, hasPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, hasPermission('votes:cast'), voteController.castVote);

router.get(
  '/summary/:amendmentId',
  protect,
  hasPermission('laws:read'),
  voteController.getVoteSummary,
);

router.get(
  '/my/:amendmentId',
  protect,
  hasPermission('votes:cast'),
  voteController.getUserVote,
);

export default router;
