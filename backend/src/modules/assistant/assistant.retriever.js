import * as Sentry from '@sentry/node';
import Element from '../../models/Element.js';
import Law from '../../models/Law.js';

const MAX_TOKENS = 6;
const TOP_K = 3;
const TEXT_TRUNCATE = 800;

function tokenize(query) {
  return [
    ...new Set(
      query
        .toLowerCase()
        .replace(/[^\wа-яіїєґ\s]/gi, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, MAX_TOKENS),
    ),
  ];
}

/**
 * Retrieve top-K relevant articles from MongoDB using regex scoring.
 * Returns enriched source objects ready for SSE DONE and system prompt injection.
 */
export async function retrieveRelevantArticles(query, contextLawId = null) {
  try {
    const tokens = tokenize(query);
    if (!tokens.length) return [];

    const escapedTokens = tokens.map((t) =>
      t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    );
    const regex = new RegExp(escapedTokens.join('|'), 'i');

    const filter = {
      type: 'article',
      $or: [{ text: regex }, { title: regex }],
    };
    if (contextLawId) {
      filter.lawId = contextLawId;
    }

    const candidates = await Element.find(filter)
      .select('lawId number title text')
      .limit(20)
      .lean();

    if (!candidates.length) return [];

    const scored = candidates.map((el) => {
      const haystack = `${el.title || ''} ${el.text || ''}`.toLowerCase();
      const hits = escapedTokens.filter((t) =>
        new RegExp(t, 'i').test(haystack),
      ).length;
      return { ...el, _hits: hits };
    });

    const top = scored.sort((a, b) => b._hits - a._hits).slice(0, TOP_K);

    const lawIds = [...new Set(top.map((e) => e.lawId))];
    const laws = await Law.find({ _id: { $in: lawIds } })
      .select('code title source')
      .lean();
    const lawMap = Object.fromEntries(laws.map((l) => [l._id.toString(), l]));

    return top.map((el, idx) => {
      const lawKey = el.lawId ? el.lawId.toString() : '';
      const law = lawMap[lawKey] || {};
      const lawTitle = law.title || lawKey;
      const articleNum = el.number || '';
      const articleTitle = el.title || '';
      return {
        // RAG fields — used for system prompt injection
        index: idx,
        lawId: el.lawId,
        lawTitle,
        articleNum,
        articleTitle,
        text: (el.text || '').slice(0, TEXT_TRUNCATE),
        // Standard source fields — required by session model and frontend
        title: `Стаття ${articleNum}${articleTitle ? ` "${articleTitle}"` : ''} — ${lawTitle}`,
        href: law.source || null,
        type: 'article',
      };
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { module: 'assistant.retriever' } });
    console.error('[assistant.retriever] error:', err.message);
    return [];
  }
}
