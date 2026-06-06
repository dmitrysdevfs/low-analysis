import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    _id: { type: String, default: 'daily' },
    date: { type: String, required: true },
    count: { type: Number, default: 0 },
  },
  { _id: false, versionKey: false },
);

const ApiGuard = mongoose.model(
  'AssistantApiGuard',
  schema,
  'assistantapiguards',
);

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Atomically increments the daily counter using an aggregation pipeline update.
 * Resets to 1 if the stored date differs from today (new day).
 * Single MongoDB round-trip — safe across multiple instances.
 *
 * @param {number} limit
 * @returns {Promise<{ allowed: boolean, used: number, limit: number, resetAt: Date }>}
 */
export async function checkAndIncrementApiGuard(limit) {
  const today = todayUTC();

  const doc = await ApiGuard.findOneAndUpdate(
    { _id: 'daily' },
    [
      {
        $set: {
          date: today,
          count: {
            $cond: {
              if: { $eq: ['$date', today] },
              then: { $add: ['$count', 1] },
              else: 1,
            },
          },
        },
      },
    ],
    { upsert: true, new: true },
  );

  const used = doc.count;
  const resetAt = new Date(`${today}T24:00:00.000Z`);

  return { allowed: used <= limit, used, limit, resetAt };
}

/**
 * Returns the current guard status without modifying the counter.
 *
 * @param {number} limit
 * @returns {Promise<{ used: number, limit: number, resetAt: Date }>}
 */
export async function getApiGuardStatus(limit) {
  const today = todayUTC();
  const doc = await ApiGuard.findById('daily').lean();

  const used = doc?.date === today ? doc.count : 0;
  const resetAt = new Date(`${today}T24:00:00.000Z`);

  return { used, limit, resetAt };
}
