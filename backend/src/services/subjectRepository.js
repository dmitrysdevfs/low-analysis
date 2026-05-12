import Subject from '../models/Subject.js';

/**
 * Finds an existing Subject by canonical_name or one of its aliases.
 * If not found — creates a new Subject document and returns its _id.
 * This is the idempotent "upsert" for the global Subject registry.
 *
 * @param {string} canonicalName - Normalized name in nominative case.
 * @param {string} [legalStatus='other'] - One of the legal_status enum values.
 * @returns {Promise<import('mongoose').Types.ObjectId>} The subject's _id.
 */
export const ensureSubjectExists = async (
  canonicalName,
  legalStatus = 'other',
) => {
  const existing = await Subject.findOne({
    $or: [{ canonical_name: canonicalName }, { aliases: canonicalName }],
  });

  if (existing) {
    return existing._id;
  }

  const created = await Subject.create({
    canonical_name: canonicalName,
    legal_status: legalStatus,
    aliases: [],
  });

  return created._id;
};

/**
 * Adds an alias to an existing subject if it is not already present.
 * @param {import('mongoose').Types.ObjectId} subjectId
 * @param {string} alias
 */
export const addAlias = async (subjectId, alias) => {
  await Subject.updateOne(
    { _id: subjectId },
    { $addToSet: { aliases: alias } },
  );
};

/**
 * Returns all subjects sorted by canonical_name.
 * @returns {Promise<Array>}
 */
export const getAllSubjects = async () => {
  return await Subject.find().select('-__v').sort({ canonical_name: 1 });
};

/**
 * Returns a single subject by its _id.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export const getSubjectById = async (id) => {
  return await Subject.findById(id).select('-__v');
};
