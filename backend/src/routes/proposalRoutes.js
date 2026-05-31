import express from 'express';
import * as proposalController from '../controllers/proposalController.js';
import { protect, hasPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

router
  .route('/')
  .post(
    protect,
    hasPermission('proposals:create'),
    proposalController.createProposal,
  )
  .get(protect, hasPermission('laws:read'), proposalController.getProposals);

router
  .route('/:id')
  .get(protect, hasPermission('laws:read'), proposalController.getProposalById)
  .patch(
    protect,
    hasPermission('proposals:create'),
    proposalController.updateProposal,
  );

router.post(
  '/:id/submit',
  protect,
  hasPermission('proposals:submit'),
  proposalController.submitProposal,
);

router.get(
  '/:id/document',
  protect,
  hasPermission('laws:read'),
  proposalController.generateDocument,
);

export default router;
