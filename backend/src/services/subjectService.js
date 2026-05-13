import Subject from '../models/Subject.js';
import Element from '../models/Element.js';

// ── Read ──────────────────────────────────────────────────────────────────────

export const getAllSubjects = async () => {
  return await Subject.find().select('-__v').sort({ canonical_name: 1 });
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
