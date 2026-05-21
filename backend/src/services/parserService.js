import * as cheerio from 'cheerio';
import { extractDefinitions } from '../utils/definitionExtractor.js';

// ─── CSS class → element type mapping ────────────────────────────────────────
// Based on analysis of zakon.rada.gov.ua HTML structure:
//   data-tree="rzN"       → section  (Розділ)
//   data-tree="stN"       → article  (Стаття)
//   data-tree="ch_N:stM"  → part     (Частина/абзац)
//   data-tree="cm_N:..."  → comment  (editorial note — skipped)
//   data-tree="nz_N"      → law title node — used for law-level metadata

const SECTION_CLASS = 'rvps7'; // <p class="rvps7"> — Розділ header
const ARTICLE_CLASS = 'rvps2'; // <p class="rvps2"> — Стаття + частини
const TITLE_SPAN = 'rvts78'; // <span class="rvts78"> — law title
const SECTION_SPAN = 'rvts15'; // <span class="rvts15"> — section text
const ARTICLE_SPAN = 'rvts9'; // <span class="rvts9"> — "Стаття N."

/**
 * Parses the .frame HTML from zakon.rada.gov.ua into a structured law object.
 *
 * @param {string} html - Raw HTML content of the .frame page
 * @param {string} [mainHtml] - Raw HTML content of the main page (optional)
 * @returns {{ title: string, code: string, elements: Array, preamble: string|null, status: string|null, signatory: string|null }} parsed data
 */
export const parseLawHtml = (html, mainHtml = null) => {
  const $ = cheerio.load(html);

  let status = null;
  if (mainHtml) {
    const $main = cheerio.load(mainHtml);
    status =
      $main('.status').first().text().trim() ||
      $main('span.valid').first().text().trim() ||
      $main('.doc-status').first().text().trim() ||
      null;
  }

  // ── 1. Extract law title ──────────────────────────────────────────────────
  let title = '';
  const titleAnchor = $('a[data-tree^="nz_"]').first();
  if (titleAnchor.length) {
    title = titleAnchor.parent().text().trim();
  }
  if (!title) {
    title =
      $(`.${TITLE_SPAN}`).first().text().trim() ||
      $('p.rvps1 span').first().text().trim() ||
      '';
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

  // ── 3. Parse elements & Extract metadata ──────────────────────────────────
  const elements = [];
  let order = 0;
  let currentSectionId = null;
  let currentArticleId = null;

  let preambleText = [];
  let signatoryText = [];
  let hasHitFirstDataTree = false;

  // We iterate over all <p> tags inside #article
  $('#article p').each((_, el) => {
    const $p = $(el);
    const anchor = $p.find('a[data-tree]').first();
    const text = $p.text().trim();

    if (!anchor.length) {
      if (text && text.length > 0 && !text.startsWith('{')) {
        if (!hasHitFirstDataTree) {
          // It's before the first structured element, might be preamble
          preambleText.push(text);
        } else {
          // It's after the first structured element but has no data-tree.
          // We keep a rolling buffer of the last few elements for the signatory block.
          // If a new valid element comes, we clear this buffer.
          signatoryText.push(text);
        }
      }
      return;
    }

    const dataTree = anchor.attr('data-tree') || '';
    const anchorName = anchor.attr('name') || '';

    // Skip editorial comments (cm_N:...)
    if (dataTree.startsWith('cm_') || dataTree.startsWith('nz_')) return;

    hasHitFirstDataTree = true;
    signatoryText = []; // Clear signatory buffer because we found a real element

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
        : code
          ? `${code}.st${number}`
          : `st${number}`;

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
        const sectionBase = currentSectionId
          ? currentSectionId.code
          : code
            ? code
            : '';
        baseCode = sectionBase ? `${sectionBase}.${articleStr}` : articleStr;
      }

      const partCode = [baseCode, ...childParts].join('.');
      const parentCode = [baseCode, ...childParts.slice(0, -1)].join('.');
      const depth = 1 + childParts.length;

      const leafNodeStr = childParts[childParts.length - 1]; // e.g. 'ch_1', 'pu1', 'ppa_1'

      let elementType = 'paragraph';
      let partNumber = '';

      const partMatch = text.match(/^(\d+)\.\s/);
      const pointMatch = text.match(/^(\d+)\)\s/);
      const subPointMatch = text.match(/^([а-яєіїґ]+)\)\s/i);

      if (partMatch) {
        elementType = 'part';
        partNumber = partMatch[1];
      } else if (pointMatch) {
        elementType = 'point';
        partNumber = pointMatch[1];
      } else if (subPointMatch) {
        elementType = 'sub_point';
        partNumber = subPointMatch[1];
      } else {
        const parentStr =
          childParts.length > 1
            ? childParts[childParts.length - 2]
            : articleStr;
        if (parentStr.startsWith('st')) {
          elementType = 'part';
        } else {
          elementType = 'paragraph';
        }
        const numberMatch = leafNodeStr.match(/\d+/);
        partNumber = numberMatch ? numberMatch[0] : '';
      }
      elements.push({
        type: elementType,
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

  const preamble = preambleText.length > 0 ? preambleText.join('\n') : null;
  const signatory = signatoryText.length > 0 ? signatoryText.join('\n') : null;

  const definitions = extractDefinitions(elements);
  const global_context = {
    preamble,
    definitions,
  };

  return { title, code, elements, preamble, status, signatory, global_context };
};
