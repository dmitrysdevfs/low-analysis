/**
 * CLI script for calculating statistical indicators for a law.
 *
 * Usage:
 *   node scripts/calculateStats.js <lawId> | --all
 *
 * Example:
 *   node scripts/calculateStats.js 6641a3b2e4f5d12345678abc
 *   node scripts/calculateStats.js --all
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

import connectDB from '../src/config/db.js';
import { performStatisticalAnalysis } from '../src/services/statisticalAnalysisService.js';
import Law from '../src/models/Law.js';

const args = process.argv.slice(2);
const allFlag = args.includes('--all');
const lawId = allFlag ? null : args.find((arg) => !arg.startsWith('--'));

if (!allFlag && !lawId) {
  console.error('❌ Error: lawId or --all flag is required.');
  console.log('Usage: node scripts/calculateStats.js <lawId> | --all');
  process.exit(1);
}

async function main() {
  console.log(`\n📊 Statistical Analysis CLI`);

  await connectDB();

  if (allFlag) {
    console.log('   Analyzing all laws...');
    const laws = await Law.find({}, '_id title code');
    if (!laws || laws.length === 0) {
      console.log('   No laws found in the database.');
      process.exit(0);
    }
    console.log(`   Found ${laws.length} laws to analyze.\n`);

    for (const law of laws) {
      console.log(
        `   Analyzing law: ${law.title} (Code: ${law.code}, ID: ${law._id})`,
      );
      try {
        const result = await performStatisticalAnalysis(law._id.toString());
        console.log(`✅ Analysis complete for law ${law.code}:`);
        console.log(`   Total Elements     : ${result.totalElements}`);
        console.log(`   Mean Chars         : ${result.meanChars.toFixed(2)}`);
        console.log(
          `   Standard Deviation : ${result.standardDeviation.toFixed(2)}`,
        );
      } catch (error) {
        console.error(`❌ Failed to analyze law ${law.code}:`, error.message);
      }
      console.log('--------------------------------------------------');
    }
  } else {
    console.log(`   Law ID : ${lawId}\n`);

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
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
