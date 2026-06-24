import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import * as notesService from '../services/notes.service.js';

const router = Router();

router.use(protect);

/**
 * @swagger
 * /api/notes:
 *   get:
 *     summary: List current user's notes
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100 }
 *     responses:
 *       200:
 *         description: Notes list
 *   post:
 *     summary: Create note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type: { type: string, example: manual }
 *               noteText: { type: string }
 *               color: { type: string, example: gold }
 *               pinned: { type: boolean }
 *               lawId: { type: string }
 *               lawTitle: { type: string }
 *               articleNum: { type: string }
 *               articleTitle: { type: string }
 *               selectedText: { type: string }
 *               pageUrl: { type: string }
 *               pageTitle: { type: string }
 *     responses:
 *       201:
 *         description: Note created
 */
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

/**
 * @swagger
 * /api/notes/migrate:
 *   post:
 *     summary: Bulk import notes from client storage
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [notes]
 *             properties:
 *               notes:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Import summary
 */
router.post('/migrate', async (req, res, next) => {
  try {
    const { notes } = req.body;
    const result = await notesService.bulkCreateNotes(req.user._id, notes);
    res.json({ imported: result.length });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/notes/{id}/pin:
 *   patch:
 *     summary: Toggle pinned state for note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated note
 *       404:
 *         description: Note not found
 */
router.patch('/:id/pin', async (req, res, next) => {
  try {
    const note = await notesService.togglePin(req.user._id, req.params.id);
    res.json(note);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/notes/{id}:
 *   patch:
 *     summary: Update note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               noteText: { type: string }
 *               color: { type: string }
 *               pinned: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated note
 *   delete:
 *     summary: Delete note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Note removed
 */
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
