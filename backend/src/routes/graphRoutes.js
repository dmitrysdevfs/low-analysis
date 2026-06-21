import { Router } from 'express';
import { guestRateLimit } from '../middleware/guestRateLimit.js';
import {
  getLawGraph,
  getGlobalGraphHandler,
  getGraphPath,
  getGraphSubjectsHandler,
} from '../controllers/graphController.js';

const router = Router();

router.use(guestRateLimit);

router.get('/subjects', getGraphSubjectsHandler);
router.get('/law/:id', getLawGraph);
router.get('/global', getGlobalGraphHandler);
router.get('/path', getGraphPath);

export default router;
