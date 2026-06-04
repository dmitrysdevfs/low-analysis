import { Router } from 'express';
import dashboardRoutes from './dashboard.js';
import usersRoutes from './users.js';
import auditRoutes from './audit.js';
import superCodeRoutes from './superCode.js';

const router = Router();
router.use('/dashboard', dashboardRoutes);
router.use('/users', usersRoutes);
router.use('/audit', auditRoutes);
router.use('/super-code', superCodeRoutes);
export default router;
