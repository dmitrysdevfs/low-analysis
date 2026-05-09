import Subject from '../models/Subject.js';
import Element from '../models/Element.js';

// ── Read ──────────────────────────────────────────────────────────────────────

export const getAllSubjects = async () => {
  return await Subject.find().select('-__v').sort({ name: 1 });
};

export const getSubjectElements = async (subjectId) => {
  const subject = await Subject.findById(subjectId).select('-__v');
  if (!subject) return null;

  const elements = await Element.find({
    _id: { $in: subject.elementIds },
  })
    .select('-__v')
    .sort({ depth: 1, order: 1 });

  return { subject, elements };
};
