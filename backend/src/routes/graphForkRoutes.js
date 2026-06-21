import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createFork,
  getMyForks,
  getForkById,
  updateFork,
  deleteFork,
} from '../controllers/graphForkController.js';

const router = Router();

router.use(protect); // всі роути вимагають авторизації

router.get('/my', getMyForks);
router.post('/', createFork);
router.get('/:id', getForkById);
router.put('/:id', updateFork);
router.delete('/:id', deleteFork);

export default router;
