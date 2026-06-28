import mongoose from 'mongoose';
import Law from '../models/Law.js';
import Element from '../models/Element.js';
import { classifyElement } from './taxonomyService.js';

// ── Read ──────────────────────────────────────────────────────────────────────

export const getAllLaws = async ({
  q = '',
  searchIn = 'title',
  sortBy = 'date',
  sortOrder = 'desc',
  status,
  dateFrom,
  dateTo,
  documentType,
  number,
  numberType = 'starts',
  subjectId,
  page = 1,
  limit = 10,
} = {}) => {
  const filter = {};
  const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  if (subjectId) {
    const lawIds = await Element.distinct('lawId', {
      'subjects.subject_id': new mongoose.Types.ObjectId(subjectId),
    });
    filter._id = { $in: lawIds };
  }

  if (q) {
    const qRegex = new RegExp(escapeRegex(q), 'i');
    if (searchIn === 'text') {
      filter.$or = [
        { preamble: { $regex: qRegex } },
        { 'global_context.definitions.term': { $regex: qRegex } },
        { 'global_context.definitions.definition': { $regex: qRegex } },
      ];
    } else if (searchIn === 'code') {
      filter.code = { $regex: qRegex };
    } else {
      filter.title = { $regex: qRegex };
    }
  }

  if (number) {
    const escaped = escapeRegex(number);
    let pattern;
    if (numberType === 'exact') {
      pattern = `^${escaped}$`;
    } else if (numberType === 'contains') {
      pattern = escaped;
    } else {
      pattern = `^${escaped}`;
    }
    const numberCondition = { $regex: new RegExp(pattern, 'i') };

    // If `q` with searchIn=code already targets `code`, keep both conditions.
    if (filter.code) {
      filter.$and = [{ code: filter.code }, { code: numberCondition }];
      delete filter.code;
    } else {
      filter.code = numberCondition;
    }
  }

  if (status) {
    filter.status = {
      $regex: new RegExp(`^${escapeRegex(status)}$`, 'i'),
    };
  }

  if (documentType) {
    filter.documentType = {
      $elemMatch: {
        $regex: new RegExp(`^${escapeRegex(documentType)}$`, 'i'),
      },
    };
  }

  if (dateFrom || dateTo) {
    filter.adoptedDate = {};
    if (dateFrom) filter.adoptedDate.$gte = dateFrom;
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      filter.adoptedDate.$lte = endOfDay;
    }
  }

  const sortField = sortBy === 'title' ? 'title' : 'adoptedDate';
  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Law.find(filter)
      .select('-__v')
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean(),
    Law.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

export const getLawById = async (id) => {
  return await Law.findById(id).select('-__v');
};

/**
 * Returns general statistics for a law based on its elements.
 * @param {string} lawId
 * @returns {Promise<object>}
 */
export const getLawStats = async (lawId) => {
  const elements = await Element.find({ lawId }).lean();
  if (!elements || elements.length === 0) return null;

  const totalElements = elements.length;
  const totalChars = elements.reduce(
    (acc, el) => acc + (el.chars_count || 0),
    0,
  );
  const meanChars = totalChars / totalElements;

  const variance =
    elements.reduce(
      (acc, el) => acc + Math.pow((el.chars_count || 0) - meanChars, 2),
      0,
    ) / totalElements;
  const standardDeviation = Math.sqrt(variance);

  const riskLevels = { green: 0, yellow: 0, red: 0, null: 0 };
  elements.forEach((el) => {
    const level = el.risk_level || 'null';
    riskLevels[level] = (riskLevels[level] || 0) + 1;
  });

  return { totalElements, meanChars, standardDeviation, riskLevels };
};

/**
 * Returns stats for multiple laws in a single MongoDB aggregation.
 * Replaces N individual getLawStats calls.
 * @param {string[]} lawIds
 * @returns {Promise<Record<string, object>>}
 */
export const getLawStatsBulk = async (lawIds) => {
  if (!lawIds.length) return {};

  const objectIds = lawIds.map((id) => new mongoose.Types.ObjectId(id));

  const results = await Element.aggregate([
    { $match: { lawId: { $in: objectIds } } },
    {
      $group: {
        _id: '$lawId',
        totalElements: { $sum: 1 },
        totalChars: { $sum: { $ifNull: ['$chars_count', 0] } },
        stdDev: { $stdDevPop: { $ifNull: ['$chars_count', 0] } },
        green: { $sum: { $cond: [{ $eq: ['$risk_level', 'green'] }, 1, 0] } },
        yellow: { $sum: { $cond: [{ $eq: ['$risk_level', 'yellow'] }, 1, 0] } },
        red: { $sum: { $cond: [{ $eq: ['$risk_level', 'red'] }, 1, 0] } },
        nullCount: {
          $sum: {
            $cond: [{ $in: ['$risk_level', [null, '']] }, 1, 0],
          },
        },
      },
    },
  ]);

  const map = {};
  for (const r of results) {
    map[r._id] = {
      totalElements: r.totalElements,
      meanChars: r.totalElements > 0 ? r.totalChars / r.totalElements : 0,
      standardDeviation: r.stdDev ?? 0,
      riskLevels: {
        green: r.green,
        yellow: r.yellow,
        red: r.red,
        null: r.nullCount,
      },
    };
  }
  return map;
};

/**
 * Returns all Elements for a given law, sorted by order.
 * Supports filtering by function, domain, and subject.
 * If filtered, recursively includes parent elements.
 */
export const getLawTree = async (
  lawId,
  { legalFunction, domain, subjectId } = {},
) => {
  const allElements = await Element.find({ lawId })
    .select('-__v')
    .sort({ depth: 1, order: 1 })
    .lean();

  if (!legalFunction && !domain && !subjectId) {
    return allElements;
  }

  // Filtering logic
  const filteredSet = new Set();
  const elementMap = new Map();
  allElements.forEach((el) => elementMap.set(String(el._id), el));

  allElements.forEach((el) => {
    let matches = true;

    if (
      legalFunction &&
      !el.taxonomy?.legalFunctions?.includes(legalFunction)
    ) {
      matches = false;
    }
    if (domain && !el.taxonomy?.domains?.includes(domain)) {
      matches = false;
    }
    if (
      subjectId &&
      !el.subjects?.some((s) => String(s.subject_id) === String(subjectId))
    ) {
      matches = false;
    }

    if (matches && (legalFunction || domain || subjectId)) {
      // Add this element and all its parents recursively
      let current = el;
      while (current) {
        filteredSet.add(String(current._id));
        current = current.parentId
          ? elementMap.get(String(current.parentId))
          : null;
      }
    }
  });

  return allElements.filter((el) => filteredSet.has(String(el._id)));
};

export const getElement = async (id) => {
  return await Element.findById(id).select('-__v').lean();
};

/**
 * Returns law metadata and its ordered list of articles.
 * @param {string} lawId
 * @returns {Promise<{title, documentType, documentNumber, adoptedDate, signatory, status, articles: {number, title}[]}|null>}
 */
export const getLawStructure = async (lawId) => {
  const [law, articles] = await Promise.all([
    Law.findById(lawId)
      .select('title documentType code adoptedDate signatory status')
      .lean(),
    Element.find({ lawId, type: 'article' })
      .select('_id number title order')
      .sort({ order: 1 })
      .lean(),
  ]);

  if (!law) return null;

  return {
    title: law.title,
    documentType: law.documentType,
    documentNumber: law.code,
    adoptedDate: law.adoptedDate ?? null,
    signatory: law.signatory ?? null,
    status: law.status ?? null,
    articles: articles.map((a) => ({
      _id: a._id.toString(),
      number: a.number ?? null,
      title: a.title ?? null,
    })),
  };
};

export const getLawHeatmap = async (lawId) => {
  return await Element.find({ lawId })
    .select('code type number title chars_count z_score risk_level taxonomy')
    .sort({ order: 1 })
    .lean();
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
  const {
    code,
    title,
    source,
    status,
    preamble,
    signatory,
    adoptedDate,
    documentType,
    global_context,
  } = lawData;
  const update = { title, source, status, preamble, signatory };

  if (adoptedDate != null) update.adoptedDate = adoptedDate;
  if (documentType != null && documentType.length > 0)
    update.documentType = documentType;
  if (global_context !== undefined) update.global_context = global_context;

  const law = await Law.findOneAndUpdate(
    { code },
    { $set: update },
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
 * BE-2 + BE-4: Recalculates law statistics from the actual DB state and
 * updates the Law document. Excludes articles with "{...виключено...}" placeholder
 * texts so that totalArticles reflects only currently active provisions.
 *
 * Must be called AFTER bulkUpsertElements + deleteMissingElements are complete.
 *
 * @param {string|mongoose.Types.ObjectId} lawId
 * @returns {Promise<void>}
 */
export const updateLawStatsFromDb = async (lawId) => {
  // Count only active articles — exclude records whose text is a "{...виключено...}"
  // or "{...вилучено...}" placeholder left by the official amendment process.
  const [totalArticles, totalSections, totalParagraphs] = await Promise.all([
    Element.countDocuments({
      lawId,
      type: 'article',
      $nor: [{ text: /^\{[^}]*виключено/i }, { text: /^\{[^}]*вилучено/i }],
    }),
    Element.countDocuments({ lawId, type: 'section' }),
    Element.countDocuments({
      lawId,
      type: 'paragraph',
      $nor: [{ text: /^\{[^}]*виключено/i }, { text: /^\{[^}]*вилучено/i }],
    }),
  ]);

  await Law.findByIdAndUpdate(lawId, {
    totalArticles,
    totalSections,
    totalParagraphs,
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

  // 3. Resolve parentId & apply taxonomy classification
  const elementsToSave = elementsWithIds.map((el) => {
    return {
      ...el,
      lawId,
      parentId: el.parentCode ? codeToIdMap[el.parentCode] || null : null,
      taxonomy: el.taxonomy || classifyElement(el),
    };
  });

  return { elementsToSave, activeCodes: Array.from(usedCodes) };
};
