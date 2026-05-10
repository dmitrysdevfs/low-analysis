import Law from '../models/Law.js';
import Element from '../models/Element.js';

// ── Read ──────────────────────────────────────────────────────────────────────

export const getAllLaws = async (q = '') => {
  const filter = q ? { title: { $regex: q, $options: 'i' } } : {};
  return await Law.find(filter).select('-__v').sort({ adoptedDate: -1 });
};

export const getLawById = async (id) => {
  return await Law.findById(id).select('-__v');
};

/**
 * Returns all Elements for a given law, sorted by order.
 * The tree structure is flat here; callers can build hierarchy client-side
 * or via buildTree() helper if needed.
 */
export const getLawTree = async (lawId) => {
  return await Element.find({ lawId })
    .select('-__v')
    .sort({ depth: 1, order: 1 });
};

/**
 * Returns a specific article and all its child elements (parts, paragraphs).
 * @param {string} lawId
 * @param {string} articleNumber - e.g. "1", "15"
 */
export const getArticle = async (lawId, articleNumber) => {
  const article = await Element.findOne({
    lawId,
    type: 'article',
    number: articleNumber,
  }).select('-__v');

  if (!article) return null;

  const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const codePrefix = new RegExp(`^${escapeRegex(article.code)}\\.`);

  const children = await Element.find({
    lawId,
    $or: [{ parentId: article._id }, { code: codePrefix }],
  })
    .select('-__v')
    .sort({ order: 1 });

  return { article, children };
};

// ── Write ─────────────────────────────────────────────────────────────────────

export const upsertLaw = async (lawData) => {
  const { code, title, source, status, preamble, signatory } = lawData;
  const law = await Law.findOneAndUpdate(
    { code },
    { $set: { title, source, status, preamble, signatory } },
    { new: true, upsert: true }
  );
  return law;
};

export const bulkUpsertElements = async (elements) => {
  const bulkOps = elements.map((el) => {
    const { _id, code, ...updateFields } = el;
    return {
      updateOne: {
        filter: { code },
        update: {
          $set: updateFields,
          $setOnInsert: { _id, code },
        },
        upsert: true,
      },
    };
  });

  if (bulkOps.length > 0) {
    return await Element.bulkWrite(bulkOps);
  }
  return null;
};

export const deleteMissingElements = async (lawId, activeCodes) => {
  return await Element.deleteMany({
    lawId,
    code: { $nin: activeCodes },
  });
};
