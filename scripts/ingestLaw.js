import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from '../src/config/db.js';
import { parseLawHtml } from '../src/services/parserService.js';
import { createLaw, addElements } from '../src/services/lawService.js';

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

  // Persist Law document
  const law = await createLaw({
    title,
    code,
    source: absolutePath,
  });

  // Persist Elements (attach lawId resolved from the created Law)
  let savedElements = [];
  if (elements.length > 0) {
    const elementsWithLawId = elements.map((el) => ({ ...el, lawId: law._id }));
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

