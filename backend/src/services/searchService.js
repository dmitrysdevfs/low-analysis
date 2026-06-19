import Law from '../models/Law.js';
import Element from '../models/Element.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SNIPPET_RADIUS = 80;

const POOL_LIMIT = 200;

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

const searchLaws = async (q, { status, dateFrom, dateTo }) => {
  if (!q) return [];

  const filter = { title: { $regex: new RegExp(escapeRegex(q), 'i') } };
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

  const laws = await Law.find(filter).select('title').limit(POOL_LIMIT).lean();

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

const searchElements = async (q, lawIds) => {
  if (!q) return [];

  const baseFilter = lawIds ? { lawId: { $in: lawIds } } : {};

  const [textHits, numberHits] = await Promise.all([
    Element.find(
      { ...baseFilter, $text: { $search: q } },
      { score: { $meta: 'textScore' } },
    )
      .select('lawId type number title text')
      .sort({ score: { $meta: 'textScore' } })
      .limit(POOL_LIMIT)
      .lean(),
    Element.find({
      ...baseFilter,
      type: 'article',
      number: { $regex: new RegExp(`^${escapeRegex(q)}`) },
    })
      .select('lawId type number title text')
      .limit(POOL_LIMIT)
      .lean(),
  ]);

  const byId = new Map();
  for (const el of [...textHits, ...numberHits]) {
    if (!byId.has(String(el._id))) byId.set(String(el._id), el);
  }
  const elements = [...byId.values()];

  if (elements.length === 0) return [];

  const uniqueLawIds = [...new Set(elements.map((el) => String(el.lawId)))];
  const laws = await Law.find({ _id: { $in: uniqueLawIds } })
    .select('title')
    .lean();
  const lawTitle = new Map(laws.map((l) => [String(l._id), l.title ?? null]));

  return elements.map((el) => {
    const titleHit =
      el.title && el.title.toLowerCase().includes(q.toLowerCase());
    return {
      law_id: String(el.lawId),
      law_name: lawTitle.get(String(el.lawId)) ?? null,
      article_number: el.number ?? null,
      article_title: el.title ?? null,
      snippet: buildSnippet(el.text || el.title, q),
      match_type: elementMatchType(el.type),
      _tier: titleHit ? TIER.ARTICLE_TITLE : TIER.ARTICLE_TEXT,
      _score: el.score ?? 0,
    };
  });
};

const byRelevance = (a, b) => b._tier - a._tier || b._score - a._score;

/**
 * Full-text search across laws and articles.
 * @param {object} params
 * @param {string} params.q - search query (required, non-empty)
 * @param {'law'|'article'|'all'} [params.type='all']
 * @param {string} [params.status]
 * @param {Date} [params.dateFrom]
 * @param {Date} [params.dateTo]
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
  page = 1,
  limit = 20,
} = {}) => {
  const lawIds =
    type === 'law'
      ? null
      : await resolveFilteredLawIds({ status, dateFrom, dateTo });

  const [lawResults, elementResults] = await Promise.all([
    type === 'article' ? [] : searchLaws(q, { status, dateFrom, dateTo }),
    type === 'law' ? [] : searchElements(q, lawIds),
  ]);

  const merged = [...lawResults, ...elementResults].sort(byRelevance);

  const total = merged.length;
  const skip = (page - 1) * limit;
  const data = merged.slice(skip, skip + limit).map((row) => {
    const publicRow = { ...row };
    delete publicRow._tier;
    delete publicRow._score;
    return publicRow;
  });

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
