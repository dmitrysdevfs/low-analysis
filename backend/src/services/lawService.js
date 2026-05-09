import Law from '../models/Law.js';
import Element from '../models/Element.js';

// ── Read ──────────────────────────────────────────────────────────────────────

export const getAllLaws = async () => {
  return await Law.find().select('-__v').sort({ adoptedDate: -1 });
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
  const codePrefix = new RegExp('^' + escapeRegex(article.code) + '\\.');

  const children = await Element.find({ lawId, code: codePrefix })
    .select('-__v')
    .sort({ order: 1 });

  return { article, children };
};

// ── Write ─────────────────────────────────────────────────────────────────────

export const createLaw = async (lawData) => {
  return await Law.create(lawData);
};

export const addElements = async (elements) => {
  return await Element.insertMany(elements);
};

/**
 * Removes a law and all its associated elements.
 */
export const removeLawData = async (code) => {
  const law = await Law.findOne({ code });
  if (law) {
    await Element.deleteMany({ lawId: law._id });
    await Law.deleteOne({ _id: law._id });
    return true;
  }
  return false;
};
