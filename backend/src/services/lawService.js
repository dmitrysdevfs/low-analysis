import mongoose from 'mongoose';
import Law from '../models/Law.js';
import Element from '../models/Element.js';

// ── Read ──────────────────────────────────────────────────────────────────────

export const getAllLaws = async (q = '') => {
  const filter = q
    ? {
        title: {
          $regex: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
        },
      }
    : {};
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
 * Returns a specific article, its child elements (parts, paragraphs), and the source URL of the law.
 * @param {string} lawId
 * @param {string} articleNumber - e.g. "1", "15"
 * @returns {Promise<{lawUrl: string|null, article: object, children: object[]}|null>}
 */
export const getArticle = async (lawId, articleNumber) => {
  const [article, law] = await Promise.all([
    Element.findOne({
      lawId,
      type: 'article',
      number: articleNumber,
    }).select('-__v'),
    Law.findById(lawId).select('source'),
  ]);

  if (!article) return null;

  const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const codePrefix = new RegExp(`^${escapeRegex(article.code)}\\.`);

  const children = await Element.find({
    lawId,
    $or: [{ parentId: article._id }, { code: codePrefix }],
  })
    .select('-__v')
    .sort({ order: 1 });

  return { lawUrl: law?.source ?? null, article, children };
};

// ── Write ─────────────────────────────────────────────────────────────────────

export const upsertLaw = async (lawData) => {
  const { code, title, source, status, preamble, signatory } = lawData;
  const law = await Law.findOneAndUpdate(
    { code },
    { $set: { title, source, status, preamble, signatory } },
    { new: true, upsert: true },
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

/**
 * Resolves the ObjectIds and parentIds for parsed elements to preserve database links.
 * @param {string|mongoose.Types.ObjectId} lawId
 * @param {Array} rawElements - elements returned by parserService
 * @returns {Promise<{ elementsToSave: Array, activeCodes: string[] }>}
 */
export const resolveElementHierarchy = async (lawId, rawElements) => {
  // 1. Query existing elements to preserve _id
  const existingElements = await Element.find({ lawId }, { code: 1, _id: 1 });
  const codeToIdMap = {};
  existingElements.forEach((el) => {
    codeToIdMap[el.code] = el._id;
  });

  // 2. Resolve ObjectIds for all incoming elements (use existing or generate new)
  const usedCodes = new Set();

  const elementsWithIds = rawElements.map((el) => {
    let uniqueCode = el.code;
    let counter = 1;
    while (usedCodes.has(uniqueCode)) {
      uniqueCode = `${el.code}_dup${counter}`;
      counter++;
    }
    usedCodes.add(uniqueCode);

    // Assign existing ID or generate new
    const id = codeToIdMap[uniqueCode] || new mongoose.Types.ObjectId();
    codeToIdMap[uniqueCode] = id; // Add to map for parent resolution

    return { ...el, code: uniqueCode, _id: id };
  });

  // 3. Resolve parentId
  const elementsToSave = elementsWithIds.map((el) => {
    return {
      ...el,
      lawId,
      parentId: el.parentCode ? codeToIdMap[el.parentCode] || null : null,
    };
  });

  return { elementsToSave, activeCodes: Array.from(usedCodes) };
};
