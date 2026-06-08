import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import * as notesService from '../services/notes.service.js';

const router = Router();

router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const { type, limit } = req.query;
    const notes = await notesService.getNotes(req.user._id, {
      type: type || undefined,
      limit: limit ? Number(limit) : 100,
    });
    res.json(notes);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const note = await notesService.createNote(req.user._id, req.body);
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
});

// bulk migration endpoint — frontend sends existing localStorage notes on first login
router.post('/migrate', async (req, res, next) => {
  try {
    const { notes } = req.body;
    const result = await notesService.bulkCreateNotes(req.user._id, notes);
    res.json({ imported: result.length });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/pin', async (req, res, next) => {
  try {
    const note = await notesService.togglePin(req.user._id, req.params.id);
    res.json(note);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const note = await notesService.updateNote(
      req.user._id,
      req.params.id,
      req.body,
    );
    res.json(note);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await notesService.deleteNote(req.user._id, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
