import test from 'node:test';
import assert from 'node:assert';
import { parseLawHtml } from './parserService.js';

test('parseLawHtml should extract law title and code', () => {
  const html = `
    <html>
      <body>
        <div id="edition">
          <option selected value="https://zakon.rada.gov.ua/laws/show/123-45/ed2023">Версія</option>
        </div>
        <p><a data-tree="nz_1">Закон про Тестування</a></p>
        <div id="article"></div>
      </body>
    </html>
  `;
  const result = parseLawHtml(html);
  
  assert.strictEqual(result.title, 'Закон про Тестування');
  assert.strictEqual(result.code, '123-45');
  assert.deepStrictEqual(result.elements, []);
});

test('parseLawHtml should correctly parse sections, articles, and nested elements', () => {
  const html = `
    <html>
      <body>
        <div id="edition">
          <option selected value="https://zakon.rada.gov.ua/laws/show/999-99/ed">Версія</option>
        </div>
        <div id="article">
          <p class="rvps7"><a data-tree="rz1" name="n2"></a><span class="rvts15">Розділ I</span></p>
          <p class="rvps2"><a data-tree="st1" name="n3"></a><span class="rvts9">Стаття 1.</span> Текст першої статті.</p>
          <p class="rvps2"><a data-tree="pu1:st1" name="n4"></a>Текст пункту 1.</p>
        </div>
      </body>
    </html>
  `;
  
  const result = parseLawHtml(html);
  
  assert.strictEqual(result.elements.length, 3);
  
  // Section check
  const section = result.elements[0];
  assert.strictEqual(section.type, 'section');
  assert.strictEqual(section.number, '1');
  assert.strictEqual(section.code, '999-99.rz1');
  
  // Article check
  const article = result.elements[1];
  assert.strictEqual(article.type, 'article');
  assert.strictEqual(article.number, '1');
  assert.strictEqual(article.title, 'Стаття 1.');
  assert.strictEqual(article.text, 'Текст першої статті.');
  assert.strictEqual(article.parentCode, '999-99.rz1');
  assert.strictEqual(article.code, '999-99.rz1.st1');
  
  // Nested paragraph (point) check
  const paragraph = result.elements[2];
  assert.strictEqual(paragraph.type, 'paragraph');
  assert.strictEqual(paragraph.number, '1');
  assert.strictEqual(paragraph.text, 'Текст пункту 1.');
  assert.strictEqual(paragraph.parentCode, '999-99.rz1.st1');
  assert.strictEqual(paragraph.code, '999-99.rz1.st1.pu1');
});
