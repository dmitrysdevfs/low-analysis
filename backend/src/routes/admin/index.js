import { Router } from 'express';
import dashboardRoutes from './dashboard.js';
import usersRoutes from './users.js';
import auditRoutes from './audit.js';
import superCodeRoutes from './superCode.js';
import legislatorRequestsRoutes from './legislatorRequests.js';

const router = Router();
router.use('/dashboard', dashboardRoutes);
router.use('/users', usersRoutes);
router.use('/audit', auditRoutes);
router.use('/super-code', superCodeRoutes);
router.use('/legislator-requests', legislatorRequestsRoutes);
export default router;
