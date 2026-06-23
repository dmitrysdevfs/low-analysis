import Subject from '../models/Subject.js';
import Element from '../models/Element.js';
import { getSubjectCounts } from './subjectMetrics.service.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── Read ──────────────────────────────────────────────────────────────────────

export const getAllSubjects = async () => {
  const [subjects, counts] = await Promise.all([
    Subject.find().select('-__v').lean(),
    getSubjectCounts(),
  ]);

  return subjects
    .map((s) => {
      const c = counts.get(s._id.toString()) ?? {
        elements_count: 0,
        laws_count: 0,
      };
      return {
        ...s,
        elements_count: c.elements_count,
        laws_count: c.laws_count,
      };
    })
    .sort((a, b) => {
      if (b.elements_count !== a.elements_count)
        return b.elements_count - a.elements_count;
      if (b.laws_count !== a.laws_count) return b.laws_count - a.laws_count;
      return a.canonical_name.localeCompare(b.canonical_name, 'uk');
    });
};

export const getSubjectById = async (id) => {
  return await Subject.findById(id).select('-__v');
};

/**
 * Autocomplete search over the subject registry.
 * Matches `q` against canonical_name and aliases (partial, case-insensitive).
 * Ranks exact matches first, then prefix, then partial; ties broken by mention
 * count (desc) and canonical name. Returns `{ _id, name, count }`.
 *
 * @param {string} q - search term
 * @param {object} [opts]
 * @param {number} [opts.limit=10] - max results
 * @returns {Promise<Array<{_id: string, name: string, count: number}>>}
 */
export const searchSubjects = async (q, { limit = 10 } = {}) => {
  const term = (q ?? '').trim();
  if (!term) return [];

  const regex = new RegExp(escapeRegex(term), 'i');
  const subjects = await Subject.find({
    $or: [{ canonical_name: regex }, { aliases: regex }],
  })
    .select('canonical_name aliases')
    .lean();

  if (subjects.length === 0) return [];

  const counts = await getSubjectCounts({
    subjectIds: subjects.map((s) => s._id),
  });

  const lower = term.toLowerCase();

  const matchRank = (subject) => {
    const names = [subject.canonical_name, ...(subject.aliases ?? [])].map(
      (n) => n.toLowerCase(),
    );
    if (names.some((n) => n === lower)) return 0;
    if (names.some((n) => n.startsWith(lower))) return 1;
    return 2;
  };

  return subjects
    .map((s) => ({
      subject: s,
      rank: matchRank(s),
      count: counts.get(s._id.toString())?.elements_count ?? 0,
    }))
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        b.count - a.count ||
        a.subject.canonical_name.localeCompare(b.subject.canonical_name, 'uk'),
    )
    .slice(0, limit)
    .map(({ subject, count }) => ({
      _id: subject._id.toString(),
      name: subject.canonical_name,
      count,
    }));
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
