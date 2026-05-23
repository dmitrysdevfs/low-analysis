import express from 'express';
import * as taxonomyController from '../controllers/taxonomyController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/taxonomies:
 *   get:
 *     summary: Get all taxonomy categories
 *     tags: [Taxonomy]
 */
router.get('/', taxonomyController.getAllTaxonomies);

/**
 * @swagger
 * /api/taxonomies/tree:
 *   get:
 *     summary: Get taxonomy hierarchy as a tree
 *     tags: [Taxonomy]
 */
router.get('/tree', taxonomyController.getTaxonomyTree);

/**
 * @swagger
 * /api/taxonomies/analyze/{lawId}:
 *   post:
 *     summary: Run rule-based classification on all elements of a law
 *     tags: [Taxonomy]
 *     parameters:
 *       - in: path
 *         name: lawId
 *         required: true
 *         schema:
 *           type: string
 */
router.post(
  '/analyze/:lawId',
  protect,
  authorize(['admin']),
  taxonomyController.analyzeLaw,
);

export default router;
