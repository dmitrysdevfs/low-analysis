import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import * as meService from '../services/me.service.js';

const router = Router();

router.use(protect);

/**
 * @swagger
 * /api/me/preferences:
 *   get:
 *     summary: Get current user preferences
 *     tags: [Me]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preference object
 *   patch:
 *     summary: Update current user preferences
 *     tags: [Me]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailAlerts: { type: boolean }
 *               searchHighlights: { type: boolean }
 *               compactMode: { type: boolean }
 *               weeklyDigest: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated preference object
 */
router.get('/preferences', async (req, res, next) => {
  try {
    const prefs = await meService.getPreferences(req.user._id);
    res.json(prefs);
  } catch (err) {
    next(err);
  }
});

router.patch('/preferences', async (req, res, next) => {
  try {
    const prefs = await meService.updatePreferences(req.user._id, req.body);
    res.json(prefs);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/me/saved:
 *   get:
 *     summary: Get saved laws or articles
 *     tags: [Me]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saved items
 *   post:
 *     summary: Save a law or article
 *     tags: [Me]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lawId, title]
 *             properties:
 *               lawId: { type: string }
 *               title: { type: string }
 *               code: { type: string }
 *               note: { type: string }
 *               tags:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       201:
 *         description: Saved item created or returned if duplicate
 */
router.get('/saved', async (req, res, next) => {
  try {
    const items = await meService.getSavedArticles(req.user._id);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.post('/saved', async (req, res, next) => {
  try {
    const item = await meService.createSavedArticle(req.user._id, req.body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/me/saved/migrate:
 *   post:
 *     summary: Bulk import saved items
 *     tags: [Me]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Import summary
 */
router.post('/saved/migrate', async (req, res, next) => {
  try {
    const { items } = req.body;
    const result = await meService.bulkCreateSavedArticles(req.user._id, items);
    res.json({ imported: result.length });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/me/saved/{id}:
 *   delete:
 *     summary: Remove saved item
 *     tags: [Me]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Saved item removed
 */
router.delete('/saved/:id', async (req, res, next) => {
  try {
    await meService.deleteSavedArticle(req.user._id, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/me/topics:
 *   get:
 *     summary: Get focus topics
 *     tags: [Me]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Focus topics
 *   post:
 *     summary: Create focus topic
 *     tags: [Me]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [label]
 *             properties:
 *               label: { type: string }
 *     responses:
 *       201:
 *         description: Focus topic created
 */
router.get('/topics', async (req, res, next) => {
  try {
    const topics = await meService.getFocusTopics(req.user._id);
    res.json(topics);
  } catch (err) {
    next(err);
  }
});

router.post('/topics', async (req, res, next) => {
  try {
    const { label } = req.body;
    const topic = await meService.createFocusTopic(req.user._id, label);
    res.status(201).json(topic);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/me/topics/migrate:
 *   post:
 *     summary: Bulk import focus topics
 *     tags: [Me]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [topics]
 *             properties:
 *               topics:
 *                 type: array
 *                 items:
 *                   oneOf:
 *                     - type: string
 *                     - type: object
 *                       properties:
 *                         label: { type: string }
 *     responses:
 *       200:
 *         description: Import summary
 */
router.post('/topics/migrate', async (req, res, next) => {
  try {
    const { topics } = req.body;
    const result = await meService.bulkCreateFocusTopics(req.user._id, topics);
    res.json({ imported: result.length });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/me/topics/{id}:
 *   delete:
 *     summary: Delete focus topic
 *     tags: [Me]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Topic removed
 */
router.delete('/topics/:id', async (req, res, next) => {
  try {
    await meService.deleteFocusTopic(req.user._id, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/me/changes:
 *   get:
 *     summary: Get normalized feed of my changes
 *     tags: [Me]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Forks, proposals and amendments created by current user
 */
router.get('/changes', async (req, res, next) => {
  try {
    const changes = await meService.getMyChanges(req.user._id);
    res.json(changes);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/me/history:
 *   get:
 *     summary: Get my legislator history
 *     tags: [Me]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated history feed
 */
router.get('/history', async (req, res, next) => {
  try {
    const { type, page, limit } = req.query;
    const { getLegislatorHistory } = await import('../services/historyService.js');
    const data = await getLegislatorHistory(req.user._id, { type, page, limit });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/me/analytics:
 *   get:
 *     summary: Get personal legislator analytics
 *     tags: [Me]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *     responses:
 *       200:
 *         description: Personal analytics
 */
router.get('/analytics', async (req, res, next) => {
  try {
    const period = req.query.period || 'month';
    const data = await meService.getLegislatorAnalytics(req.user._id, period);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
