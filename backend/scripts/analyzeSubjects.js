/**
 * CLI script for batch subject analysis of a law.
 *
 * Usage:
 *   node scripts/analyzeSubjects.js --lawId=<id> [--force] [--delay=500]
 *
 * Options:
 *   --lawId=<id>   MongoDB ObjectId of the law to analyze (required)
 *   --force        Re-analyze elements that already have subjects[]
 *   --delay=<ms>   Delay between LLM API calls in ms (default: 500)
 *
 * Example:
 *   node scripts/analyzeSubjects.js --lawId=6641a3b2e4f5d12345678abc --force --delay=300
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

import connectDB from '../src/config/db.js';
import { analyzeLaw } from '../src/services/batchAnalysisService.js';

// ── Parse CLI args ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (name) => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : null;
};
const hasFlag = (name) => args.includes(`--${name}`);

const lawId = getArg('lawId');
const force = hasFlag('force');
const delay = parseInt(getArg('delay') ?? '500', 10);

if (!lawId) {
  console.error('❌ Error: --lawId=<id> is required.');
  process.exit(1);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔍 Subject Analysis CLI`);
  console.log(`   Law ID : ${lawId}`);
  console.log(`   Force  : ${force}`);
  console.log(`   Delay  : ${delay}ms\n`);

  await connectDB();

  const result = await analyzeLaw(lawId, { force, delayMs: delay });

  console.log('\n✅ Analysis complete:');
  console.log(`   Processed     : ${result.processed}`);
  console.log(`   Subjects found: ${result.subjectsFound}`);
  console.log(`   Skipped       : ${result.skipped}`);
  console.log(`   Errors        : ${result.errors}`);

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
