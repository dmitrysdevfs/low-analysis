import Element from '../models/Element.js';

/**
 * Aggregates elements_count and laws_count per subject.
 * Source of truth: Element.subjects[].subject_id (reverse lookup).
 * Returns a Map<subjectId.toString(), { elements_count, laws_count }>.
 */
export async function getSubjectCounts() {
  const rows = await Element.aggregate([
    { $match: { 'subjects.0': { $exists: true } } },
    { $unwind: '$subjects' },
    {
      $group: {
        _id: '$subjects.subject_id',
        elements_count: { $sum: 1 },
        lawIds: { $addToSet: '$lawId' },
      },
    },
    {
      $project: {
        elements_count: 1,
        laws_count: { $size: '$lawIds' },
      },
    },
  ]);

  const map = new Map();
  for (const row of rows) {
    if (row._id == null) continue;
    map.set(row._id.toString(), {
      elements_count: row.elements_count,
      laws_count: row.laws_count,
    });
  }
  return map;
}
