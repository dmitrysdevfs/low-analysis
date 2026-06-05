import { Router } from 'express';
import {
  getLawGraph,
  getGlobalGraphHandler,
  getGraphPath,
} from '../controllers/graphController.js';

const router = Router();

router.get('/law/:id', getLawGraph);
router.get('/global', getGlobalGraphHandler);
router.get('/path', getGraphPath);

export default router;
