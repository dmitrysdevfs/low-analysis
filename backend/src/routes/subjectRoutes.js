import express from 'express';
import {
  getAllSubjects,
  getSubjectElements,
} from '../controllers/subjectController.js';

const router = express.Router();

router.get('/', getAllSubjects);
router.get('/:id/elements', getSubjectElements);

export default router;
