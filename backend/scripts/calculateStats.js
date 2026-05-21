/**
 * CLI script for calculating statistical indicators for a law.
 *
 * Usage:
 *   node scripts/calculateStats.js <lawId>
 *
 * Example:
 *   node scripts/calculateStats.js 6641a3b2e4f5d12345678abc
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

import connectDB from '../src/config/db.js';
import { performStatisticalAnalysis } from '../src/services/statisticalAnalysisService.js';

const lawId = process.argv[2];

if (!lawId) {
  console.error('❌ Error: lawId is required.');
  console.log('Usage: node scripts/calculateStats.js <lawId>');
  process.exit(1);
}

async function main() {
  console.log(`\n📊 Statistical Analysis CLI`);
  console.log(`   Law ID : ${lawId}\n`);

  await connectDB();

  try {
    const result = await performStatisticalAnalysis(lawId);

    console.log('✅ Analysis complete:');
    console.log(`   Total Elements     : ${result.totalElements}`);
    console.log(`   Mean Chars         : ${result.meanChars.toFixed(2)}`);
    console.log(
      `   Standard Deviation : ${result.standardDeviation.toFixed(2)}`,
    );
  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
