import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from '../src/config/db.js';
import mongoose from 'mongoose';
import { parseLawHtml } from '../src/services/parserService.js';
import { createLaw, addElements, removeLawData } from '../src/services/lawService.js';

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
  const { title, code, elements } = parseLawHtml(html);

  if (!title || !code) {
    throw new Error('Parser returned no title or code. Check parserService.js.');
  }

  console.log(`📜 Parsed: "${title}" (${code}) — ${elements.length} elements`);

  // Detect duplicates in elements
  const codes = elements.map(e => e.code);
  const duplicates = codes.filter((c, index) => codes.indexOf(c) !== index);
  if (duplicates.length > 0) {
    console.warn(`⚠️ Warning: Duplicate codes found: ${JSON.stringify([...new Set(duplicates)])}`);
    // Optional: filter out duplicates or investigate why they happen
  }

  // Cleanup existing data for this law code
  console.log(`🧹 Cleaning up existing data for code: ${code}`);
  await removeLawData(code);

  const law = await createLaw({
    title,
    code,
    source: `https://zakon.rada.gov.ua/laws/show/${code}#Text`,
  });

  // Persist Elements (attach lawId resolved from the created Law)
  let savedElements = [];
  if (elements.length > 0) {
    // 1. Pre-generate ObjectIds to build a lookup table
    elements.forEach(el => {
      el._id = new mongoose.Types.ObjectId();
    });

    const codeToIdMap = {};
    elements.forEach(el => {
      // Maps the original intended code to the LATEST seen _id
      codeToIdMap[el.code] = el._id;
    });

    const usedCodes = new Set();

    // 2. Map parentCode to parentId using the lookup table and deduplicate codes
    const elementsWithLawId = elements.map((el) => {
      let uniqueCode = el.code;
      let counter = 1;
      while (usedCodes.has(uniqueCode)) {
        uniqueCode = `${el.code}_dup${counter}`;
        counter++;
      }
      usedCodes.add(uniqueCode);

      return { 
        ...el, 
        code: uniqueCode,
        lawId: law._id,
        parentId: el.parentCode ? (codeToIdMap[el.parentCode] || null) : null
      };
    });

    savedElements = await addElements(elementsWithLawId);
  }

  // Update law stats
  const articleCount = elements.filter((el) => el.type === 'article').length;
  const sectionCount = elements.filter((el) => el.type === 'section').length;
  law.totalArticles = articleCount;
  law.totalSections = sectionCount;
  await law.save();

  console.log(`✅ Ingested: lawId=${law._id}`);
  console.log(`   Sections: ${sectionCount}, Articles: ${articleCount}, Elements total: ${savedElements.length}`);

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

