import { describe, it, expect } from 'vitest';
import { parseLawHtml } from '../services/parserService.js';

// Minimal frame HTML with one article — used as base for all parser tests
const FRAME_HTML = `
<html><body>
<div id="article">
  <p><a data-tree="nz_1"><span class="rvts78">Про Національну поліцію</span></a></p>
  <p class="rvps2"><a data-tree="st1"><span class="rvts9">Стаття 1.</span> Текст статті.</a></p>
</div>
<select id="edition">
  <option selected value="/laws/show/580-19/ed20150702">поточна</option>
</select>
</body></html>
`;

const mainHtml = (
  docCardInner,
  status = 'чинний',
  title = 'Про Національну поліцію | від 02.07.2015',
) => `
<html><head><title>${title}</title></head><body>
<span class="valid">${status}</span>
<div class="doc">${docCardInner}</div>
</body></html>
`;

describe('parseLawHtml — documentType extraction', () => {
  it('returns empty array when mainHtml is not provided', () => {
    const result = parseLawHtml(FRAME_HTML);
    expect(result.documentType).toEqual([]);
  });

  it('returns empty array when .doc-card is absent', () => {
    const result = parseLawHtml(FRAME_HTML, mainHtml(''));
    expect(result.documentType).toEqual([]);
  });

  it('extracts single type from plain <em> (Закон України)', () => {
    const card = `<div class="doc-card"><em>Закон України</em> від <span>02.07.2015</span> № <strong>580-VIII</strong></div>`;
    const result = parseLawHtml(FRAME_HTML, mainHtml(card));
    expect(result.documentType).toEqual(['Закон України']);
  });

  it('extracts multiple types from <em> with semicolon and comma (КЗпП)', () => {
    const card = `<div class="doc-card"><em>Кодекс України; Закон, Кодекс</em> від <span>10.12.1971</span> № <strong>322-VIII</strong></div>`;
    const result = parseLawHtml(FRAME_HTML, mainHtml(card));
    expect(result.documentType).toEqual(['Кодекс України', 'Закон', 'Кодекс']);
  });

  it('extracts types when issuing body is in <em> and types are outside (Конституція)', () => {
    const card = `<div class="doc-card"><em>Верховна Рада України</em>;\nКонституція України, Конституція, Закон\n від <span>28.06.1996</span> № <strong>254к/96-ВР</strong></div>`;
    const result = parseLawHtml(FRAME_HTML, mainHtml(card));
    expect(result.documentType).toEqual([
      'Верховна Рада України',
      'Конституція України',
      'Конституція',
      'Закон',
    ]);
  });

  it('extracts all types from compound КМУ resolution', () => {
    const card = `<div class="doc-card"><em>Постанова Кабінету Міністрів України; Порядок, Форма типового документа, Акт</em> від <span>22.04.2026</span> № <strong>505</strong></div>`;
    const result = parseLawHtml(FRAME_HTML, mainHtml(card));
    expect(result.documentType).toEqual([
      'Постанова Кабінету Міністрів України',
      'Порядок',
      'Форма типового документа',
      'Акт',
    ]);
  });
});

describe('parseLawHtml — status and adoptedDate extraction', () => {
  it('extracts status from span.valid', () => {
    const card = `<div class="doc-card"><em>Закон України</em> від <span>02.07.2015</span> № <strong>580-VIII</strong></div>`;
    const result = parseLawHtml(FRAME_HTML, mainHtml(card, 'чинний'));
    expect(result.status).toBe('чинний');
  });

  it('extracts adoptedDate from <title> tag', () => {
    const card = `<div class="doc-card"><em>Закон України</em> від <span>02.07.2015</span> № <strong>580-VIII</strong></div>`;
    const result = parseLawHtml(
      FRAME_HTML,
      mainHtml(card, 'чинний', 'Про поліцію | від 02.07.2015'),
    );
    expect(result.adoptedDate).toBeInstanceOf(Date);
    expect(result.adoptedDate.getFullYear()).toBe(2015);
    expect(result.adoptedDate.getMonth()).toBe(6); // July = 6 (0-indexed)
    expect(result.adoptedDate.getDate()).toBe(2);
  });

  it('returns null adoptedDate when title has no date', () => {
    const card = `<div class="doc-card"><em>Закон України</em> від <span>02.07.2015</span> № <strong>580-VIII</strong></div>`;
    const result = parseLawHtml(
      FRAME_HTML,
      mainHtml(card, 'чинний', 'Про поліцію'),
    );
    expect(result.adoptedDate).toBeNull();
  });

  it('returns null status when .doc-card has no status selectors', () => {
    const result = parseLawHtml(FRAME_HTML, '<html><body></body></html>');
    expect(result.status).toBeNull();
  });
});
