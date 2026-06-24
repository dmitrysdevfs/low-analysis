import Element from '../models/Element.js';

/**
 * Aggregates elements_count and laws_count per subject.
 * Source of truth: Element.subjects[].subject_id (reverse lookup).
 *
 * @param {object} [opts]
 * @param {Array<string|import('mongoose').Types.ObjectId>} [opts.subjectIds]
 *   When provided, only these subjects are counted — scopes the aggregation to
 *   matched elements instead of scanning the whole collection (autocomplete).
 * @returns {Promise<Map<string, { elements_count: number, laws_count: number }>>}
 */
export async function getSubjectCounts({ subjectIds } = {}) {
  const match = { 'subjects.0': { $exists: true } };
  if (subjectIds) {
    match['subjects.subject_id'] = { $in: subjectIds };
  }

  const rows = await Element.aggregate([
    { $match: match },
    { $unwind: '$subjects' },
    ...(subjectIds
      ? [{ $match: { 'subjects.subject_id': { $in: subjectIds } } }]
      : []),
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
