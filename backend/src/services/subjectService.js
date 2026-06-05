import Subject from '../models/Subject.js';
import Element from '../models/Element.js';
import { getSubjectCounts } from './subjectMetrics.service.js';

// ── Read ──────────────────────────────────────────────────────────────────────

export const getAllSubjects = async () => {
  const [subjects, counts] = await Promise.all([
    Subject.find().select('-__v').lean(),
    getSubjectCounts(),
  ]);

  return subjects
    .map((s) => {
      const c = counts.get(s._id.toString()) ?? { elements_count: 0, laws_count: 0 };
      return { ...s, elements_count: c.elements_count, laws_count: c.laws_count };
    })
    .sort((a, b) => {
      if (b.elements_count !== a.elements_count) return b.elements_count - a.elements_count;
      if (b.laws_count !== a.laws_count) return b.laws_count - a.laws_count;
      return a.canonical_name.localeCompare(b.canonical_name, 'uk');
    });
};

export const getSubjectById = async (id) => {
  return await Subject.findById(id).select('-__v');
};

/**
 * Returns a subject and all law elements where this subject appears.
 * Elements are looked up via Element.subjects[].subject_id (reverse lookup).
 */
export const getSubjectElements = async (subjectId) => {
  const subject = await Subject.findById(subjectId).select('-__v');
  if (!subject) return null;

  const elements = await Element.find({ 'subjects.subject_id': subjectId })
    .select('-__v')
    .sort({ depth: 1, order: 1 });

  return { subject, elements };
};
