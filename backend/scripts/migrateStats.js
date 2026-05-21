/**
 * One-time migration: recalculate totalArticles and totalSections
 * for all laws that have already been parsed, applying the BE-2/BE-4 fix
 * (filter out excluded articles from the count).
 *
 * Run once after deploying the bugfix/be-parsing-statistics fixes.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { updateLawStatsFromDb } from '../src/services/lawService.js';
import connectDB from '../src/config/db.js';
import Law from '../src/models/Law.js';

dotenv.config();

const migrateStats = async () => {
  await connectDB();

  const laws = await Law.find({}).sort({ code: 1 });
  console.log(`Found ${laws.length} laws. Recalculating stats...\n`);

  for (const law of laws) {
    const before = {
      totalArticles: law.totalArticles,
      totalSections: law.totalSections,
    };
    await updateLawStatsFromDb(law._id);
    const updated = await Law.findById(law._id).select(
      'totalArticles totalSections',
    );
    const changed =
      before.totalArticles !== updated.totalArticles ||
      before.totalSections !== updated.totalSections;
    const icon = changed ? '🔄' : '✅';
    console.log(`${icon} ${law.code} (${law.title})`);
    if (changed) {
      console.log(
        `   totalArticles: ${before.totalArticles} → ${updated.totalArticles}`,
      );
      console.log(
        `   totalSections: ${before.totalSections} → ${updated.totalSections}`,
      );
    }
  }

  console.log('\nDone.');
  process.exit(0);
};

migrateStats().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
