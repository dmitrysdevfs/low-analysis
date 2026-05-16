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
  aliases = [],
  description = null,
) => {
  // Normalize whitespace (remove newlines, extra spaces) and lowercase
  const normalizedName = canonicalName
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  const cleanAliases = Array.isArray(aliases)
    ? aliases.map((a) => a.trim().toLowerCase()).filter(Boolean)
    : [];

  const existing = await Subject.findOne({
    $or: [{ canonical_name: normalizedName }, { aliases: normalizedName }],
  });

  if (existing) {
    const updateQuery = {};
    if (cleanAliases.length > 0) {
      updateQuery.$addToSet = { aliases: { $each: cleanAliases } };
    }
    // Only update description if the subject doesn't have one and LLM provided one
    if (description && !existing.description) {
      updateQuery.$set = { description };
    }

    if (Object.keys(updateQuery).length > 0) {
      await Subject.updateOne({ _id: existing._id }, updateQuery);
    }
    return existing._id;
  }

  try {
    const created = await Subject.create({
      canonical_name: normalizedName,
      legal_status: legalStatus,
      aliases: cleanAliases,
      description,
    });
    return created._id;
  } catch (error) {
    // 11000 is MongoDB's duplicate key error.
    // If another concurrent request just created this subject, we catch the error
    // and fetch the newly created subject instead of crashing.
    if (error.code === 11000) {
      const concurrentExisting = await Subject.findOne({
        $or: [{ canonical_name: normalizedName }, { aliases: normalizedName }],
      });
      if (concurrentExisting) {
        return concurrentExisting._id;
      }
    }
    throw error;
  }
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
