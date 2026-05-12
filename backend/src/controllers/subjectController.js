import * as subjectService from '../services/subjectService.js';
import { analyzeElement } from '../services/subjectAnalysisService.js';
import { analyzeLaw } from '../services/batchAnalysisService.js';

// ── Read ──────────────────────────────────────────────────────────────────────

export const getAllSubjects = async (req, res, next) => {
  try {
    const subjects = await subjectService.getAllSubjects();
    res.json(subjects);
  } catch (error) {
    next(error);
  }
};

export const getSubjectElements = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await subjectService.getSubjectElements(id);
    if (!result) return res.status(404).json({ message: 'Subject not found' });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ── LLM Analysis ─────────────────────────────────────────────────────────────

/**
 * POST /api/subjects/analyze/:elementId
 * Runs SRL analysis on a single law element via LLM.
 * Idempotent — re-running overwrites the previous subjects[].
 */
export const analyzeElementHandler = async (req, res, next) => {
  try {
    const { elementId } = req.params;
    const result = await analyzeElement(elementId);

    if (result.skipped) {
      return res.json({
        message: 'Element has no text content, skipped.',
        elementId,
        subjects: [],
      });
    }

    res.json({
      message: 'Analysis complete',
      elementId,
      subjectsFound: result.subjects.length,
      subjects: result.subjects,
      raw: result.raw,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/subjects/analyze-batch/:lawId
 * Runs SRL analysis on all leaf elements of a law.
 * Query params:
 *   - force=true  → re-analyze elements that already have subjects
 *   - delay=500   → ms between LLM calls (default 500)
 */
export const analyzeBatchHandler = async (req, res, next) => {
  try {
    const { lawId } = req.params;
    const force = req.query.force === 'true';
    const delay = parseInt(req.query.delay ?? '500', 10);

    const result = await analyzeLaw(lawId, { force, delayMs: delay });

    res.json({
      message: 'Batch analysis complete',
      lawId,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
