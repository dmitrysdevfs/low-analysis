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
});
