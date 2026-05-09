import express from 'express';
import {
  getAllLaws,
  getLawTree,
  getArticle,
} from '../controllers/lawController.js';

const router = express.Router();

router.get('/', getAllLaws);
router.get('/:id/tree', getLawTree);
router.get('/:id/articles/:num', getArticle);

export default router;

