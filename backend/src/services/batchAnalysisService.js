import Element from '../models/Element.js';
import Law from '../models/Law.js';
import { analyzeElement } from './subjectAnalysisService.js';

// Element types that actually contain analyzable text (leaf nodes)
const LEAF_TYPES = ['paragraph', 'point', 'sub_point', 'part'];

/**
 * Pauses execution for a given number of milliseconds.
 * Used for rate limiting between LLM API calls.
 * @param {number} ms
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs SRL subject analysis on all leaf elements of a given law.
 *
 * @param {string} lawId - MongoDB ObjectId of the Law.
 * @param {object} options
 * @param {boolean} [options.force=false]   - Re-analyze elements that already have subjects[].
 * @param {number}  [options.delayMs=500]   - Delay between LLM calls in ms (rate limiting).
 * @returns {Promise<{ processed: number, subjectsFound: number, skipped: number, errors: number }>}
 */
export const analyzeLaw = async (lawId, options = {}) => {
  const { force = false, delayMs = 500, limit = 0 } = options;

  // Verify law exists
  const law = await Law.findById(lawId);
  if (!law) {
    throw new Error(`Law not found: ${lawId}`);
  }

  // Fetch all leaf elements for this law
  const query = { lawId, type: { $in: LEAF_TYPES } };
  if (!force) {
    // Skip elements that already have subjects[] unless force=true
    query['subjects.0'] = { $exists: false };
  }

  const elements = await Element.find(query)
    .select('_id text type subjects')
    .sort({ depth: 1, order: 1 })
    .limit(limit > 0 ? limit : 0); // 0 = no limit (for CLI)

  const totalAvailable = await Element.countDocuments(query);

  console.log(
    `[batchAnalysisService] Starting batch analysis for law "${law.title}" — ${elements.length} of ${totalAvailable} elements (limit=${limit || 'none'}).`,
  );

  let processed = 0;
  let subjectsFound = 0;
  let skipped = 0;
  let errors = 0;

  for (const element of elements) {
    try {
      const result = await analyzeElement(element._id.toString());

      if (result.skipped) {
        skipped++;
      } else {
        processed++;
        subjectsFound += result.subjects.length;
      }
    } catch (error) {
      errors++;
      console.error(
        `[batchAnalysisService] Error processing element ${element._id}: ${error.message}`,
      );
    }

    // Rate limiting: wait between requests
    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  console.log(
    `[batchAnalysisService] Done. processed=${processed}, subjectsFound=${subjectsFound}, skipped=${skipped}, errors=${errors}`,
  );

  return { processed, subjectsFound, skipped, errors, totalAvailable };
};
