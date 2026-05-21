import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseLawHtml } from '../src/services/parserService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const filePath = path.resolve(__dirname, '../data/raw/254к_96-ВР_frame.html');
  const html = fs.readFileSync(filePath, 'utf-8');

  const { title, code, elements } = parseLawHtml(html);

  console.log(`Title: ${title}`);
  console.log(`Code: ${code}`);
  console.log(`Total Elements: ${elements.length}`);

  const articles = elements.filter((el) => el.type === 'article');
  console.log(`Articles parsed: ${articles.length}`);

  console.log(
    '\nArticles with non-integer numbers or without number or with "виключ":',
  );
  articles.forEach((art, idx) => {
    const isInteger = /^\d+$/.test(art.number);
    const hasExcluded =
      art.text && (art.text.includes('виключ') || art.text.includes('вилуче'));
    if (!isInteger || !art.number || hasExcluded || !art.text) {
      console.log(
        `[${idx + 1}] Code: ${art.code}, Num: "${art.number}", Title: "${art.title}", Text: "${art.text ? art.text.substring(0, 80).replace(/\n/g, ' ') : 'NULL'}"`,
      );
    }
  });
}

run().catch(console.error);
