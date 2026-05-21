import { describe, expect, it } from 'vitest';
import { parseLawHtml } from './parserService.js';

describe('parseLawHtml', () => {
  it('extracts law title and code', () => {
    const html = `
      <html>
        <body>
          <div id="edition">
            <option selected value="https://zakon.rada.gov.ua/laws/show/123-45/ed2023">Version</option>
          </div>
          <p><a data-tree="nz_1">Law on Testing</a></p>
          <div id="article"></div>
        </body>
      </html>
    `;

    const result = parseLawHtml(html);

    expect(result.title).toBe('Law on Testing');
    expect(result.code).toBe('123-45');
    expect(result.elements).toEqual([]);
  });

  it('parses sections, articles, and nested elements', () => {
    const html = `
      <html>
        <body>
          <div id="edition">
            <option selected value="https://zakon.rada.gov.ua/laws/show/999-99/ed">Version</option>
          </div>
          <div id="article">
            <p class="rvps7"><a data-tree="rz1" name="n2"></a><span class="rvts15">Section I</span></p>
            <p class="rvps2"><a data-tree="st1" name="n3"></a><span class="rvts9">Article 1.</span> Body of article one.</p>
            <p class="rvps2"><a data-tree="pu1:st1" name="n4"></a>1) Text of point one.</p>
          </div>
        </body>
      </html>
    `;

    const result = parseLawHtml(html, html);

    expect(result.elements).toHaveLength(3);
    expect(result.elements[0]).toMatchObject({
      type: 'section',
      number: '1',
      code: '999-99.rz1',
    });
    expect(result.elements[1]).toMatchObject({
      type: 'article',
      number: '1',
      parentCode: '999-99.rz1',
      code: '999-99.rz1.st1',
    });
    expect(result.elements[2]).toMatchObject({
      type: 'point',
      number: '1',
      parentCode: '999-99.rz1.st1',
      code: '999-99.rz1.st1.pu1',
    });
  });

  it('correctly extracts law preamble while skipping title, type header and comments', () => {
    const html = `
      <html>
        <body>
          <div id="edition">
            <option selected value="https://zakon.rada.gov.ua/laws/show/777-77/ed">Version</option>
          </div>
          <div id="article">
            <p class="rvps17"><a data-tree="ty_1"></a>ЗАКОН УКРАЇНИ</p>
            <p class="rvps6"><a data-tree="nz_1"></a>Про тестування преамбул</p>
            <p class="rvps2"><a data-tree="cm_1:nz_1"></a>{Редакційні коментарі}</p>
            <p class="rvps2"><a data-tree="ch_1:nz_1"></a>Цей Закон визначає правові засади...</p>
            <p class="rvps2">Цей Закон також регулює відносини у сфері...</p>
            <p class="rvps7"><a data-tree="rz1" name="n2"></a><span class="rvts15">Розділ I. ЗАГАЛЬНІ ЗАСАДИ</span></p>
            <p class="rvps2"><a data-tree="st1" name="n3"></a><span class="rvts9">Стаття 1.</span> Основні положення.</p>
          </div>
        </body>
      </html>
    `;

    const result = parseLawHtml(html, html);

    expect(result.preamble).toBe(
      'Цей Закон визначає правові засади...\nЦей Закон також регулює відносини у сфері...'
    );
    expect(result.global_context.preamble).toBe(
      'Цей Закон визначає правові засади...\nЦей Закон також регулює відносини у сфері...'
    );
  });
});
