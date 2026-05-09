import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, '..', 'data', 'raw');

/**
 * Downloads the HTML of a law from zakon.rada.gov.ua and saves it locally.
 * @param {string} code - Law code, e.g. "254%D0%BA/96-%D0%92%D0%A0" or "254к/96-ВР"
 * @example node scripts/fetchLaw.js 254к/96-ВР
 */
const fetchLaw = async (code) => {
  // encodeURI preserves '/' (path separator), while encodeURIComponent would break it.
  // Example: "254к/96-ВР" → "254%D0%BA/96-%D0%92%D0%A0" ✅
  const url = `https://zakon.rada.gov.ua/laws/show/${encodeURI(code)}`;

  console.log(`⏳ Fetching: ${url}`);

  const { data: html } = await axios.get(url, {
    headers: {
      'Accept-Language': 'uk',
      'User-Agent': 'Mozilla/5.0 (compatible; LowAnalysisBot/1.0)',
    },
    timeout: 15000,
  });

  await fs.mkdir(RAW_DIR, { recursive: true });

  // Sanitize code for use as filename (replace slashes and special chars)
  const filename = code.replace(/[\/\\:*?"<>|]/g, '_') + '.html';
  const outPath = path.join(RAW_DIR, filename);

  await fs.writeFile(outPath, html, 'utf-8');
  console.log(`✅ Saved to: ${outPath}`);
  return outPath;
};

const code = process.argv[2];
if (!code) {
  console.error('Usage: node scripts/fetchLaw.js <law-code>');
  console.error('Example: node scripts/fetchLaw.js 254к/96-ВР');
  process.exit(1);
}

fetchLaw(code).catch((err) => {
  console.error(`❌ Error: ${err.message}`);
  process.exit(1);
});
