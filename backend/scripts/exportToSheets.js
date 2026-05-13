/**
 * CLI script for exporting subject analysis results to CSV (Google Sheets compatible).
 *
 * Usage:
 *   node scripts/exportToSheets.js --lawId=<id> [--output=./export]
 *
 * Generates two CSV files in the output directory:
 *   1. subjects_summary.csv  — Law | Article | Element Text | Subject | Role | Legal Status
 *   2. elements_full.csv     — Law | Section | Article | Type | Text | Subjects (joined)
 *
 * Example:
 *   node scripts/exportToSheets.js --lawId=6641a3b2e4f5d12345678abc --output=./export
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

import connectDB from '../src/config/db.js';
import Law from '../src/models/Law.js';
import Element from '../src/models/Element.js';
import Subject from '../src/models/Subject.js';

// ── Parse CLI args ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (name) => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : null;
};

const lawId = getArg('lawId');
const outputDir = getArg('output') ?? './export';

if (!lawId) {
  console.error('❌ Error: --lawId=<id> is required.');
  process.exit(1);
}

// ── CSV Helpers ───────────────────────────────────────────────────────────────

/**
 * Escapes a value for CSV output (wraps in quotes, escapes inner quotes).
 * @param {*} val
 * @returns {string}
 */
const csvEscape = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

/**
 * Converts an array of row arrays to a CSV string.
 * @param {string[]} headers
 * @param {Array[]} rows
 * @returns {string}
 */
const toCsv = (headers, rows) => {
  const headerLine = headers.map(csvEscape).join(',');
  const dataLines = rows.map((row) => row.map(csvEscape).join(','));
  return [headerLine, ...dataLines].join('\n');
};

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n📊 Export to Sheets CLI`);
  console.log(`   Law ID : ${lawId}`);
  console.log(`   Output : ${outputDir}\n`);

  await connectDB();

  // Fetch law
  const law = await Law.findById(lawId);
  if (!law) {
    console.error(`❌ Law not found: ${lawId}`);
    process.exit(1);
  }

  console.log(`📖 Law: ${law.title}`);

  // Fetch all elements with populated subjects
  const elements = await Element.find({ lawId })
    .populate('subjects.subject_id', 'canonical_name legal_status')
    .sort({ depth: 1, order: 1 });

  // Build a lookup: elementId → breadcrumb info
  const elementMap = new Map(elements.map((el) => [el._id.toString(), el]));

  // Helper to find ancestor element of a specific type
  const findAncestor = (element, type) => {
    let current = element;
    while (current && current.parentId) {
      const parent = elementMap.get(current.parentId.toString());
      if (!parent) break;
      if (parent.type === type) return parent;
      current = parent;
    }
    return null;
  };

  // ── Sheet 1: subjects_summary.csv ─────────────────────────────────────────
  // One row per (element × subject) pair — best for subject-centric filtering

  const summaryHeaders = [
    'Закон',
    'Розділ',
    'Стаття',
    'Тип елемента',
    'Текст елемента',
    "Суб'єкт",
    'Роль',
    'Правовий статус',
  ];

  const summaryRows = [];

  for (const el of elements) {
    if (!el.subjects || el.subjects.length === 0) continue;

    const section = findAncestor(el, 'section');
    const article = findAncestor(el, 'article');

    for (const subjectEntry of el.subjects) {
      const subject = subjectEntry.subject_id; // populated
      if (!subject) continue;

      summaryRows.push([
        law.title,
        section ? `${section.number}. ${section.title || ''}`.trim() : '',
        article ? `Стаття ${article.number}` : '',
        el.type,
        el.text || '',
        subject.canonical_name,
        subjectEntry.role,
        subject.legal_status,
      ]);
    }
  }

  // ── Sheet 2: elements_full.csv ────────────────────────────────────────────
  // One row per element — best for full-text review with subjects joined

  const fullHeaders = [
    'Закон',
    'Розділ',
    'Стаття',
    'Тип елемента',
    'Код елемента',
    'Текст',
    "Суб'єкти (comma-separated)",
    "Кількість суб'єктів",
  ];

  const fullRows = elements.map((el) => {
    const section = findAncestor(el, 'section');
    const article = findAncestor(el, 'article');

    const subjectNames = (el.subjects || [])
      .map((s) => s.subject_id?.canonical_name)
      .filter(Boolean)
      .join('; ');

    return [
      law.title,
      section ? `${section.number}. ${section.title || ''}`.trim() : '',
      article ? `Стаття ${article.number}` : '',
      el.type,
      el.code,
      el.text || '',
      subjectNames,
      el.subjects?.length ?? 0,
    ];
  });

  // ── Write files ───────────────────────────────────────────────────────────

  mkdirSync(outputDir, { recursive: true });

  const summaryCsv = toCsv(summaryHeaders, summaryRows);
  const fullCsv = toCsv(fullHeaders, fullRows);

  const summaryPath = resolve(outputDir, 'subjects_summary.csv');
  const fullPath = resolve(outputDir, 'elements_full.csv');

  // UTF-8 BOM for correct display in Excel/Google Sheets
  const BOM = '\uFEFF';
  writeFileSync(summaryPath, BOM + summaryCsv, 'utf8');
  writeFileSync(fullPath, BOM + fullCsv, 'utf8');

  console.log(`✅ Export complete:`);
  console.log(`   subjects_summary.csv — ${summaryRows.length} rows`);
  console.log(`   elements_full.csv    — ${fullRows.length} rows`);
  console.log(`   Output directory     : ${resolve(outputDir)}`);

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
