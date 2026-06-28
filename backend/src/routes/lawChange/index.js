import express from 'express';
import proposalRoutes from './proposal.routes.js';
import voteRoutes from './vote.routes.js';
import approvedChangeRoutes from './approvedChange.routes.js';
import legislatorRequestRoutes from './legislatorRequest.routes.js';

const router = express.Router();

// Approved changes & law view (no /proposals prefix)
router.use('/', approvedChangeRoutes);

// Proposals CRUD
router.use('/proposals', proposalRoutes);

// Vote sub-routes nested under proposals
router.use('/proposals/:proposalId', voteRoutes);

// Legislator access requests
router.use('/legislator-requests', legislatorRequestRoutes);

export default router;
