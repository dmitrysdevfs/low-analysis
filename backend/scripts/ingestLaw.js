import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from '../src/config/db.js';
import mongoose from 'mongoose';
import { parseLawHtml } from '../src/services/parserService.js';
import {
  upsertLaw,
  bulkUpsertElements,
  deleteMissingElements,
  resolveElementHierarchy,
  updateLawStatsFromDb,
} from '../src/services/lawService.js';
import { performStatisticalAnalysis } from '../src/services/statisticalAnalysisService.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Full ingestion pipeline: HTML file → MongoDB
 * @param {string} filePath - Path to a saved .html file (from fetchLaw.js)
 * @example node scripts/ingestLaw.js data/raw/254к_96-ВР.html
 */
const ingestLaw = async (filePath) => {
  await connectDB();

  const absolutePath = path.resolve(__dirname, '..', filePath);
  console.log(`📖 Reading: ${absolutePath}`);

  const html = await fs.readFile(absolutePath, 'utf-8');

  // Attempt to read main HTML for status metadata
  let mainHtml = null;
  try {
    const mainHtmlPath = absolutePath.replace(
      /_frame\.html$|\.frame\.html$/,
      '.html',
    );
    if (mainHtmlPath !== absolutePath) {
      mainHtml = await fs.readFile(mainHtmlPath, 'utf-8');
      console.log(`📖 Reading main HTML for metadata: ${mainHtmlPath}`);
    }
  } catch (err) {
    console.log(
      `ℹ️ Main HTML not found or could not be read. Status will be null.`,
    );
  }

  const { title, code, elements, preamble, status, signatory, global_context } =
    parseLawHtml(html, mainHtml);

  if (!title || !code) {
    throw new Error(
      'Parser returned no title or code. Check parserService.js.',
    );
  }

  console.log(`📜 Parsed: "${title}" (${code}) — ${elements.length} elements`);

  // Detect duplicates in elements
  const codes = elements.map((e) => e.code);
  const duplicates = codes.filter((c, index) => codes.indexOf(c) !== index);
  if (duplicates.length > 0) {
    console.warn(
      `⚠️ Warning: Duplicate codes found: ${JSON.stringify([...new Set(duplicates)])}`,
    );
    // Optional: filter out duplicates or investigate why they happen
  }

  // Upsert Law
  console.log(`🧹 Upserting Law data for code: ${code}`);
  const law = await upsertLaw({
    title,
    code,
    source: `https://zakon.rada.gov.ua/laws/show/${code}#Text`,
    status,
    preamble,
    signatory,
    global_context,
  });

  // Persist Elements (attach lawId resolved from the created Law)
  if (elements.length > 0) {
    const { elementsToSave, activeCodes } = await resolveElementHierarchy(
      law._id,
      elements,
    );

    // Bulk upsert
    console.log(`💾 Bulk upserting ${elementsToSave.length} elements...`);
    await bulkUpsertElements(elementsToSave);

    // Hard delete missing elements
    const deletedRes = await deleteMissingElements(law._id, activeCodes);
    if (deletedRes && deletedRes.deletedCount > 0) {
      console.log(`🗑️ Deleted ${deletedRes.deletedCount} outdated elements.`);
    }
  } else {
    // If no elements parsed, delete all existing
    await deleteMissingElements(law._id, []);
  }

  // Update law stats from the actual DB state (BE-2).
  // Runs AFTER bulk write + delete; filters "{...виключено...}" placeholders (BE-4 Option B).
  await updateLawStatsFromDb(law._id);

  // Derive quick counts from the parsed array for the console summary only
  // (DB-persisted counts may differ due to exclusion filtering — that's intentional).
  const sectionCount = elements.filter((el) => el.type === 'section').length;
  const articleCount = elements.filter((el) => el.type === 'article').length;

  // Calculate statistical metrics
  try {
    console.log('📊 Calculating statistical metrics...');
    await performStatisticalAnalysis(law._id);
  } catch (statsError) {
    console.warn(
      `⚠️ Warning: Failed to calculate statistics for law ${law._id}: ${statsError.message}`,
    );
  }

  console.log(`✅ Ingested: lawId=${law._id}`);
  console.log(
    `   Sections: ${sectionCount}, Articles: ${articleCount}, Elements parsed: ${elements.length}`,
  );

  process.exit(0);
};

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/ingestLaw.js <path-to-html>');
  console.error('Example: node scripts/ingestLaw.js data/raw/254к_96-ВР.html');
  process.exit(1);
}

ingestLaw(filePath).catch((err) => {
  console.error(`❌ Error: ${err.message}`);
  process.exit(1);
});
