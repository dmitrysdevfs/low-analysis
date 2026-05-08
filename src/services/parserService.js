import * as cheerio from 'cheerio';

// ─── CSS class → element type mapping ────────────────────────────────────────
// Based on analysis of zakon.rada.gov.ua HTML structure:
//   data-tree="rzN"       → section  (Розділ)
//   data-tree="stN"       → article  (Стаття)
//   data-tree="ch_N:stM"  → part     (Частина/абзац)
//   data-tree="cm_N:..."  → comment  (editorial note — skipped)
//   data-tree="nz_N"      → law title node — used for law-level metadata

const SECTION_CLASS  = 'rvps7';   // <p class="rvps7"> — Розділ header
const ARTICLE_CLASS  = 'rvps2';   // <p class="rvps2"> — Стаття + частини
const TITLE_SPAN     = 'rvts78';  // <span class="rvts78"> — law title
const SECTION_SPAN   = 'rvts15';  // <span class="rvts15"> — section text
const ARTICLE_SPAN   = 'rvts9';   // <span class="rvts9"> — "Стаття N."

/**
 * Parses the .frame HTML from zakon.rada.gov.ua into a structured law object.
 *
 * @param {string} html - Raw HTML content of the .frame page
 * @returns {{ title: string, code: string, elements: Array }} parsed data
 */
export const parseLawHtml = (html) => {
  const $ = cheerio.load(html);

  // ── 1. Extract law title ──────────────────────────────────────────────────
  let title = '';
  const titleAnchor = $('a[data-tree^="nz_"]').first();
  if (titleAnchor.length) {
    title = titleAnchor.parent().text().trim();
  }
  if (!title) {
    title = $(`.${TITLE_SPAN}`).first().text().trim()
      || $('p.rvps1 span').first().text().trim()
      || '';
  }

  // ── 2. Extract law code from the selected <option> in the edition selector ─
  // e.g. href="...show/254%D0%BA/96-%D0%92%D0%A0/ed..."
  let code = '';
  $('#edition option[selected]').each((_, el) => {
    const href = $(el).attr('value') || '';
    // Extract the path segment between /show/ and /ed. Works for "1953-20" and "254к/96-ВР"
    const match = href.match(/\/laws\/show\/(.+?)\/ed/);
    if (match) {
      code = decodeURIComponent(match[1]);
    }
  });

  // ── 3. Parse elements ─────────────────────────────────────────────────────
  const elements = [];
  let order = 0;
  let currentSectionId = null;
  let currentArticleId = null;

  // We iterate over all <p> tags inside #article that carry a data-tree anchor
  $('#article p').each((_, el) => {
    const $p = $(el);
    const anchor = $p.find('a[data-tree]').first();
    if (!anchor.length) return;

    const dataTree = anchor.attr('data-tree') || '';
    const anchorName = anchor.attr('name') || '';

    // Skip editorial comments (cm_N:...)
    if (dataTree.startsWith('cm_') || dataTree.startsWith('nz_')) return;

    const pClass = $p.attr('class') || '';

    // ── Section (Розділ) ──────────────────────────────────────────────────
    if (pClass === SECTION_CLASS && dataTree.startsWith('rz')) {
      const sectionSpan = $p.find(`.${SECTION_SPAN}`);
      const rawText = sectionSpan.length
        ? sectionSpan.text().trim()
        : $p.text().trim();

      // Extract section number from data-tree ("rz3" → "3")
      const number = dataTree.replace('rz', '');
      const sectionCode = code ? `${code}.rz${number}` : `rz${number}`;

      order++;
      const elem = {
        type: 'section',
        code: sectionCode,
        number,
        title: rawText,
        text: null,
        parentId: null,
        depth: 0,
        order,
        anchorName,
      };
      elements.push(elem);
      currentSectionId = elem; // will be resolved to _id after DB insert
      currentArticleId = null;
      return;
    }

    // ── Article (Стаття) ──────────────────────────────────────────────────
    if (pClass === ARTICLE_CLASS && dataTree.match(/^st[\d]/)) {
      const articleSpan = $p.find(`.${ARTICLE_SPAN}`);
      if (!articleSpan.length) return; // part/paragraph without article span

      // data-tree is authoritative: "st129-1" → "129-1"
      // .rvts9 span text only shows the base: "Стаття 129." — unreliable for sub-articles
      const number = dataTree.replace(/^st/, '');

      // Title: try to use span but fall back to constructed title
      const spanText = articleSpan.text().trim();
      const title = `Стаття ${number}.`;

      // Body text = full paragraph text minus the article label
      const bodyText = $p.text().trim().replace(spanText, '').trim();

      const sectionCode = currentSectionId ? currentSectionId.code : null;
      const articleCode = sectionCode
        ? `${sectionCode}.st${number}`
        : (code ? `${code}.st${number}` : `st${number}`);

      order++;
      const elem = {
        type: 'article',
        code: articleCode,
        number,
        title,
        text: bodyText || null,
        parentCode: sectionCode,
        depth: 1,
        order,
        anchorName,
      };
      elements.push(elem);
      currentArticleId = elem;
      return;
    }


    // ── Generic Child Element (Частини, Пункти, Підпункти, Абзаци) ───────────
    if (pClass === ARTICLE_CLASS && dataTree.includes(':st')) {
      const parts = dataTree.split(':');
      const articleStr = parts.pop(); // typically 'st5' or 'st129'
      const childParts = parts.reverse(); // e.g. ['pu1', 'pp1']
      
      const text = $p.text().trim();
      if (!text) return;

      let baseCode = '';
      if (currentArticleId) {
        baseCode = currentArticleId.code;
      } else {
        const sectionBase = currentSectionId ? currentSectionId.code : (code ? code : '');
        baseCode = sectionBase ? `${sectionBase}.${articleStr}` : articleStr;
      }
      
      const partCode = [baseCode, ...childParts].join('.');
      const parentCode = [baseCode, ...childParts.slice(0, -1)].join('.');
      const depth = 1 + childParts.length;
      
      const leafNodeStr = childParts[childParts.length - 1]; // e.g. 'ch_1', 'pu1', 'ppa_1'
      const numberMatch = leafNodeStr.match(/\d+/);
      const partNumber = numberMatch ? numberMatch[0] : '';

      elements.push({
        type: leafNodeStr.startsWith('pu') ? 'point' :
              leafNodeStr.startsWith('pp') ? 'sub_point' :
              leafNodeStr.startsWith('ch') ? 'part' : 'paragraph',
        code: partCode,
        number: partNumber,
        title: null,
        text,
        parentCode,
        depth,
        order,
        anchorName,
      });
    }
  });

  return { title, code, elements };
};

