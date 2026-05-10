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
} from '../src/services/lawService.js';
import Element from '../src/models/Element.js';

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
    const mainHtmlPath = absolutePath.replace(/_frame\.html$|\.frame\.html$/, '.html');
    if (mainHtmlPath !== absolutePath) {
      mainHtml = await fs.readFile(mainHtmlPath, 'utf-8');
      console.log(`📖 Reading main HTML for metadata: ${mainHtmlPath}`);
    }
  } catch (err) {
    console.log(`ℹ️ Main HTML not found or could not be read. Status will be null.`);
  }

  const { title, code, elements, preamble, status, signatory } = parseLawHtml(html, mainHtml);

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
  });

  // Persist Elements (attach lawId resolved from the created Law)
  if (elements.length > 0) {
    // 1. Query existing elements to preserve _id
    const existingElements = await Element.find({ lawId: law._id }, { code: 1, _id: 1 });
    const codeToIdMap = {};
    existingElements.forEach(el => {
      codeToIdMap[el.code] = el._id;
    });

    // 2. Resolve ObjectIds for all incoming elements (use existing or generate new)
    const usedCodes = new Set();
    
    const elementsWithIds = elements.map(el => {
      let uniqueCode = el.code;
      let counter = 1;
      while (usedCodes.has(uniqueCode)) {
        uniqueCode = `${el.code}_dup${counter}`;
        counter++;
      }
      usedCodes.add(uniqueCode);

      // Assign existing ID or generate new
      const id = codeToIdMap[uniqueCode] || new mongoose.Types.ObjectId();
      codeToIdMap[uniqueCode] = id; // Add to map for parent resolution

      return { ...el, code: uniqueCode, _id: id };
    });

    // 3. Resolve parentId
    const elementsWithLawId = elementsWithIds.map((el) => {
      return {
        ...el,
        lawId: law._id,
        parentId: el.parentCode ? codeToIdMap[el.parentCode] || null : null,
      };
    });

    // 4. Bulk upsert
    console.log(`💾 Bulk upserting ${elementsWithLawId.length} elements...`);
    await bulkUpsertElements(elementsWithLawId);

    // 5. Hard delete missing elements
    const activeCodes = Array.from(usedCodes);
    const deletedRes = await deleteMissingElements(law._id, activeCodes);
    if (deletedRes && deletedRes.deletedCount > 0) {
      console.log(`🗑️ Deleted ${deletedRes.deletedCount} outdated elements.`);
    }
  } else {
    // If no elements parsed, delete all existing
    await deleteMissingElements(law._id, []);
  }

  // Update law stats
  const articleCount = elements.filter((el) => el.type === 'article').length;
  const sectionCount = elements.filter((el) => el.type === 'section').length;
  law.totalArticles = articleCount;
  law.totalSections = sectionCount;
  await law.save();

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
