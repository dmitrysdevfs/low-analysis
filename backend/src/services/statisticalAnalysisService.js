import Element from '../models/Element.js';

/**
 * Calculates statistical metrics for all elements of a specific law.
 * Includes character counts, subject counts, Z-scores, and "Traffic Light" risk levels.
 *
 * @param {string} lawId - The ID of the law to analyze.
 * @returns {Promise<object>} - Object containing mean, standard deviation, and count.
 */
export const performStatisticalAnalysis = async (lawId) => {
  const elements = await Element.find({ lawId });

  if (!elements || elements.length === 0) {
    throw new Error('No elements found for the specified law.');
  }

  // 1. Calculate basic counts (chars and subjects)
  const stats = elements.map((el) => {
    const chars_count = el.text ? el.text.length : 0;
    const subjects_count = el.subjects ? el.subjects.length : 0;
    return {
      _id: el._id,
      chars_count,
      subjects_count,
    };
  });

  // 2. Calculate mean (chars_count)
  const totalChars = stats.reduce((acc, curr) => acc + curr.chars_count, 0);
  const mean = totalChars / stats.length;

  // 3. Calculate standard deviation (σ)
  const variance =
    stats.reduce((acc, curr) => acc + Math.pow(curr.chars_count - mean, 2), 0) /
    stats.length;
  const stdDev = Math.sqrt(variance);

  // 4. Calculate Z-score and Risk Level
  const bulkOps = stats.map((item) => {
    let z_score = 0;
    if (stdDev > 0) {
      z_score = (item.chars_count - mean) / stdDev;
    }

    let risk_level = 'green';
    if (z_score > 2) {
      risk_level = 'red';
    } else if (z_score > 1) {
      risk_level = 'yellow';
    }

    return {
      updateOne: {
        filter: { _id: item._id },
        update: {
          $set: {
            chars_count: item.chars_count,
            subjects_count: item.subjects_count,
            z_score: z_score,
            risk_level: risk_level,
          },
        },
      },
    };
  });

  // 5. Mass update in MongoDB
  if (bulkOps.length > 0) {
    await Element.bulkWrite(bulkOps);
  }

  return {
    totalElements: elements.length,
    meanChars: mean,
    standardDeviation: stdDev,
  };
};
