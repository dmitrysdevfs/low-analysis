import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import * as meService from '../services/me.service.js';

const router = Router();

router.use(protect);

// ── Preferences ───────────────────────────────────────────────────────────────

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

// ── Saved Articles ────────────────────────────────────────────────────────────

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

router.post('/saved/migrate', async (req, res, next) => {
  try {
    const { items } = req.body;
    const result = await meService.bulkCreateSavedArticles(req.user._id, items);
    res.json({ imported: result.length });
  } catch (err) {
    next(err);
  }
});

router.delete('/saved/:id', async (req, res, next) => {
  try {
    await meService.deleteSavedArticle(req.user._id, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ── Focus Topics ──────────────────────────────────────────────────────────────

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

router.post('/topics/migrate', async (req, res, next) => {
  try {
    const { topics } = req.body;
    const result = await meService.bulkCreateFocusTopics(req.user._id, topics);
    res.json({ imported: result.length });
  } catch (err) {
    next(err);
  }
});

router.delete('/topics/:id', async (req, res, next) => {
  try {
    await meService.deleteFocusTopic(req.user._id, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
