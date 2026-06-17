import { Router } from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import * as supervisorController from '../controllers/supervisor.controller.js';

const router = Router();

router.use(protect);
router.use(authorize('supervisor', 'admin'));

router.get('/dashboard', supervisorController.getDashboard);
router.get('/groups', supervisorController.getGroups);
router.post('/groups', supervisorController.createGroup);
router.get('/groups/:id', supervisorController.getGroup);
router.put('/groups/:id', supervisorController.updateGroup);

export default router;
