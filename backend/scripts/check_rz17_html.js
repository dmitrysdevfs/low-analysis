import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const filePath = path.resolve(__dirname, '../data/raw/2019-19.frame.html');
  const html = fs.readFileSync(filePath, 'utf-8');

  const $ = cheerio.load(html);

  console.log('Searching for Section XVII elements in HTML...');

  // Find all p tags with class rvps7
  const pTags = $('p.rvps7');
  console.log(`Found ${pTags.length} p.rvps7 tags`);

  let targetP = null;
  pTags.each((_, el) => {
    const text = $(el).text();
    if (
      text.includes('Розділ XVII') ||
      text.includes('ПРИКІНЦЕВІ ТА ПЕРЕХІДНІ ПОЛОЖЕННЯ')
    ) {
      targetP = $(el);
      console.log(`Found matching paragraph: "${text.trim()}"`);
      const anchor = targetP.find('a[data-tree]');
      console.log(
        `Anchor data-tree: "${anchor.attr('data-tree')}", name: "${anchor.attr('name')}"`,
      );
    }
  });

  if (targetP) {
    console.log('\n--- Printing next paragraphs ---');
    let current = targetP.next();
    for (let i = 0; i < 40; i++) {
      if (!current.length) break;
      const text = current.text().trim();
      const pClass = current.attr('class') || '';
      const anchor = current.find('a[data-tree]').first();
      const dataTree = anchor.length ? anchor.attr('data-tree') || '' : '';
      console.log(
        `[${i + 1}] Class: "${pClass}", DataTree: "${dataTree}", Text (first 100 chars): "${text.substring(0, 100).replace(/\n/g, ' ')}"`,
      );
      current = current.next();
    }
  } else {
    console.log('Could not find paragraph for Section XVII');
  }
}

run().catch(console.error);
