import mongoose from 'mongoose';
import Law from '../models/Law.js';
import Element from '../models/Element.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SNIPPET_RADIUS = 80;

const TIER = {
  LAW_TITLE: 3,
  ARTICLE_TITLE: 2,
  ARTICLE_TEXT: 1,
};

/**
 * Builds a short snippet centred on the first literal occurrence of `q`.
 * Falls back to the head of the text when the match is only a stemmed one
 * @param {string|null|undefined} text
 * @param {string} q
 * @returns {string|null}
 */
export const buildSnippet = (text, q) => {
  if (!text) return null;
  const trimmed = String(text).trim();
  const idx = q ? trimmed.toLowerCase().indexOf(q.toLowerCase()) : -1;

  if (idx === -1) {
    return trimmed.length > SNIPPET_RADIUS * 2
      ? `${trimmed.slice(0, SNIPPET_RADIUS * 2).trimEnd()}…`
      : trimmed;
  }

  const start = Math.max(0, idx - SNIPPET_RADIUS);
  const end = Math.min(trimmed.length, idx + q.length + SNIPPET_RADIUS);
  let snippet = trimmed.slice(start, end).trim();
  if (start > 0) snippet = `…${snippet}`;
  if (end < trimmed.length) snippet = `${snippet}…`;
  return snippet;
};

/**
 * Maps a flat element type to the public match_type used in results.
 * @param {string} type
 * @returns {'article'|'paragraph'}
 */
const elementMatchType = (type) =>
  type === 'article' ? 'article' : 'paragraph';

const stripInternal = (row) => {
  const result = { ...row };
  delete result._tier;
  delete result._score;
  return result;
};

const byRelevance = (a, b) => b._tier - a._tier || b._score - a._score;

const resolveFilteredLawIds = async ({ status, dateFrom, dateTo }) => {
  if (!status && !dateFrom && !dateTo) return null;

  const filter = {};
  if (status) {
    filter.status = { $regex: new RegExp(`^${escapeRegex(status)}$`, 'i') };
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

  const laws = await Law.find(filter).select('_id').lean();
  return laws.map((l) => l._id);
};

/**
 * Law-title hits (tier 3). Laws are a small catalogue, so every match is
 * fetched and ranked in memory.
 */
const searchLaws = async (q, { status, dateFrom, dateTo, lawIds }) => {
  if (!q) return [];

  const filter = { title: { $regex: new RegExp(escapeRegex(q), 'i') } };
  if (lawIds) filter._id = { $in: lawIds };
  if (status) {
    filter.status = { $regex: new RegExp(`^${escapeRegex(status)}$`, 'i') };
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

  const laws = await Law.find(filter).select('title').lean();

  return laws.map((law) => ({
    law_id: String(law._id),
    law_name: law.title ?? null,
    article_number: null,
    article_title: null,
    snippet: buildSnippet(law.title, q),
    match_type: 'law',
    _tier: TIER.LAW_TITLE,
    _score: law.title ? q.length / law.title.length : 0,
  }));
};

/**
 * Element hits (tier 1-2) as a single aggregation that sorts and paginates
 * inside MongoDB and returns an exact total via $facet.
 * @returns {Promise<{docs: object[], total: number}>}
 */
const searchElementsPaged = async (q, baseMatch, skip, take) => {
  if (!q && Object.keys(baseMatch).length === 0) return { docs: [], total: 0 };

  const facet = { total: [{ $count: 'n' }] };
  if (take > 0) {
    facet.data = [{ $skip: skip }, { $limit: take }];
  }

  if (!q) {
    const pipeline = [
      { $match: baseMatch },
      { $addFields: { _score: 0, _tier: TIER.ARTICLE_TEXT } },
      { $sort: { _id: 1 } },
      { $facet: facet },
    ];
    const [result] = await Element.aggregate(pipeline).allowDiskUse(true);
    return {
      docs: result?.data ?? [],
      total: result?.total?.[0]?.n ?? 0,
    };
  }

  const escaped = escapeRegex(q);

  const pipeline = [
    { $match: { ...baseMatch, $text: { $search: q } } },
    { $addFields: { _score: { $meta: 'textScore' } } },

    {
      $unionWith: {
        coll: Element.collection.name,
        pipeline: [
          {
            $match: {
              ...baseMatch,
              type: 'article',
              number: { $regex: `^${escaped}` },
            },
          },
          { $addFields: { _score: 0 } },
        ],
      },
    },
    {
      $group: {
        _id: '$_id',
        lawId: { $first: '$lawId' },
        type: { $first: '$type' },
        number: { $first: '$number' },
        title: { $first: '$title' },
        text: { $first: '$text' },
        _score: { $max: '$_score' },
      },
    },
    {
      $addFields: {
        _tier: {
          $cond: [
            {
              $regexMatch: {
                input: { $ifNull: ['$title', ''] },
                regex: escaped,
                options: 'i',
              },
            },
            TIER.ARTICLE_TITLE,
            TIER.ARTICLE_TEXT,
          ],
        },
      },
    },
    { $sort: { _tier: -1, _score: -1, _id: 1 } },
    { $facet: facet },
  ];

  const [result] = await Element.aggregate(pipeline).allowDiskUse(true);
  return {
    docs: result?.data ?? [],
    total: result?.total?.[0]?.n ?? 0,
  };
};

const mapElementDocs = async (docs, q) => {
  if (docs.length === 0) return [];

  const uniqueLawIds = [...new Set(docs.map((d) => String(d.lawId)))];
  const laws = await Law.find({ _id: { $in: uniqueLawIds } })
    .select('title')
    .lean();
  const lawTitle = new Map(laws.map((l) => [String(l._id), l.title ?? null]));

  return docs.map((d) => ({
    law_id: String(d.lawId),
    law_name: lawTitle.get(String(d.lawId)) ?? null,
    article_number: d.number ?? null,
    article_title: d.title ?? null,
    snippet: buildSnippet(d.text || d.title, q),
    match_type: elementMatchType(d.type),
  }));
};

/**
 * Full-text search across laws and articles, optionally filtered by subject.
 * Either `q` or `subjectId` must be provided.
 * @param {object} params
 * @param {string} [params.q] - search query (optional when subjectId is set)
 * @param {'law'|'article'|'all'} [params.type='all']
 * @param {string} [params.status]
 * @param {Date} [params.dateFrom]
 * @param {Date} [params.dateTo]
 * @param {string} [params.subjectId] - restrict hits to this regulatory subject
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @returns {Promise<{data: object[], pagination: object}>}
 */
export const search = async ({
  q,
  type = 'all',
  status,
  dateFrom,
  dateTo,
  subjectId,
  page = 1,
  limit = 20,
} = {}) => {
  const subjectOid = subjectId ? new mongoose.Types.ObjectId(subjectId) : null;

  const statusDateLawIds =
    type === 'law'
      ? null
      : await resolveFilteredLawIds({ status, dateFrom, dateTo });

  const subjectLawIds = subjectOid
    ? await Element.distinct('lawId', { 'subjects.subject_id': subjectOid })
    : null;

  const lawRows =
    type === 'article'
      ? []
      : await searchLaws(q, {
          status,
          dateFrom,
          dateTo,
          lawIds: subjectLawIds,
        });
  lawRows.sort(byRelevance);
  const lawTotal = lawRows.length;

  const skip = (page - 1) * limit;
  const elemSkip = Math.max(0, skip - lawTotal);
  const elemTake = Math.max(0, skip + limit - lawTotal - elemSkip);

  const elementMatch = {};
  if (statusDateLawIds) elementMatch.lawId = { $in: statusDateLawIds };
  if (subjectOid) elementMatch['subjects.subject_id'] = subjectOid;

  const { docs: elementDocs, total: elementTotal } =
    type === 'law'
      ? { docs: [], total: 0 }
      : await searchElementsPaged(q, elementMatch, elemSkip, elemTake);

  const total = lawTotal + elementTotal;

  const lawSlice = lawRows.slice(
    Math.min(skip, lawTotal),
    Math.min(skip + limit, lawTotal),
  );
  const elementRows = await mapElementDocs(elementDocs, q);
  const data = [...lawSlice, ...elementRows].map(stripInternal);

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
