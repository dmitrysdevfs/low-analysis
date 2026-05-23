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
 * Checks if a table element represents a signatory block (like President, Prime Minister, etc.).
 * @param {import('cheerio').Cheerio<import('domhandler').Element>} $table - The table element wrapper
 * @returns {boolean} True if this table is a signatory table, false otherwise
 */
export const isSignatoryTable = ($table) => {
  const tableText = $table.text().toLowerCase();
  const signatoryKeywordsRegex =
    /(президент|голова верховної ради|прем['’\-—]міністр)/i;
  return signatoryKeywordsRegex.test(tableText);
};

/**
 * Parses the .frame HTML from zakon.rada.gov.ua into a structured law object.
 *
 * @param {string} html - Raw HTML content of the .frame page
 * @param {string} [mainHtml] - Raw HTML content of the main page (optional)
 * @returns {{ title: string, code: string, elements: Array, preamble: string|null, status: string|null, signatory: string|null, adoptedDate: Date|null, documentType: string[] }} parsed data
 */
export const parseLawHtml = (html, mainHtml = null) => {
  const $ = cheerio.load(html);

  let status = null;
  let adoptedDate = null;
  let documentType = [];
  if (mainHtml) {
    const $main = cheerio.load(mainHtml);
    status =
      $main('.status').first().text().trim() ||
      $main('span.valid').first().text().trim() ||
      $main('.doc-status').first().text().trim() ||
      null;

    // Extract adoption date from <title>: "... від 28.06.1996 ..."
    const titleText = $main('title').first().text();
    const dateMatch = titleText.match(/від (\d{2})\.(\d{2})\.(\d{4})/);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      adoptedDate = new Date(
        Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)),
      );
    }

    // Extract document types from .doc-card — clone to strip date/number nodes
    const docCard = $main('.doc-card').first().clone();
    docCard.find('span, strong').remove();
    const typePart = docCard
      .text()
      .trim()
      .split(/\s+від\s+/)[0]
      .trim();
    if (typePart) {
      documentType = typePart
        .split(/[;,]/)
        .map((t) => t.trim())
        .filter(Boolean);
    }
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

    // Skip paragraphs nested inside table elements to prevent table cell text leaking into signatory or elements,
    // EXCEPT when the table is a signatory block (contains President, Chairman, PM, etc.)
    const $table = $p.closest('table');
    if ($table.length > 0 && !isSignatoryTable($table)) {
      return;
    }

    const anchor = $p.find('a[data-tree]').first();
    const text = $p.text().trim();

    const dataTree = anchor.length ? anchor.attr('data-tree') || '' : '';
    const anchorName = anchor.length ? anchor.attr('name') || '' : '';

    // A real body element (section, article, or sub-element) signals the end of the preamble zone
    const isBodyElement =
      dataTree.startsWith('rz') ||
      dataTree.startsWith('st') ||
      dataTree.startsWith('kg') ||
      dataTree.startsWith('kn') || // Book structures like kn_1 or knpersha_1
      dataTree.startsWith('gl') ||
      dataTree.includes(':st') ||
      text.toLowerCase().startsWith('книга ') ||
      text.toLowerCase().startsWith('глава ') ||
      text.toLowerCase().startsWith('розділ ') ||
      text.toLowerCase().startsWith('загальна частина') ||
      text.toLowerCase().startsWith('особлива частина');

    if (isBodyElement) {
      hasHitFirstDataTree = true;
      signatoryText = []; // Clear signatory buffer because we found a real body element
    }

    if (!hasHitFirstDataTree) {
      // In the preamble zone, we collect descriptive text paragraphs.
      // We skip editorial remarks, law title, and law type header.
      const isEditorial = text.startsWith('{') || dataTree.startsWith('cm_');
      const isLawTitleOrType =
        dataTree.startsWith('ty') || dataTree.startsWith('nz');

      // Skip generic document type headers, law titles, and publication metadata
      const lowerText = text.toLowerCase().trim();
      const cleanTitle = title ? title.toLowerCase().trim() : '';
      const normalizedText = lowerText.replace(/\s+/g, ' ');
      const normalizedTitle = cleanTitle.replace(/\s+/g, ' ');

      const isDocHeader =
        normalizedText === 'закон україни' ||
        normalizedText === 'конституція україни' ||
        normalizedText === 'кодекс україни' ||
        normalizedText.endsWith('кодекс україни') ||
        normalizedText.startsWith('кодекс україни') ||
        normalizedText === normalizedTitle ||
        (normalizedTitle &&
          normalizedText.replace('закон україни', '').trim() ===
            normalizedTitle);

      const isPublicationInfo =
        text.startsWith('(') &&
        (lowerText.includes('відомості верховної ради') ||
          lowerText.includes('офіційний вісник') ||
          lowerText.includes('урядовий кур'));

      if (
        text &&
        text.length > 0 &&
        !isEditorial &&
        !isLawTitleOrType &&
        !isDocHeader &&
        !isPublicationInfo
      ) {
        preambleText.push(text);
      }
      // Non-body elements in this zone (like headers, comments, or actual preamble text)
      // are not part of the structured sections/articles list.
      if (!isBodyElement) {
        return;
      }
    } else {
      // Once we are in the body zone:
      if (!anchor.length) {
        if (text && text.length > 0 && !text.startsWith('{')) {
          signatoryText.push(text);
        }
        return;
      }

      if (dataTree.startsWith('cm_') || dataTree.startsWith('nz_')) return;
    }

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
    // BE-3: Use dataTree.includes(':') instead of ':st' to also capture elements
    // that belong directly to sections (e.g., Розділ XVII of the Market Law has
    // data-tree like "pu1:rz17", "ch_1:pu1:rz17" — no ":st" prefix).
    if (pClass === ARTICLE_CLASS && dataTree.includes(':')) {
      const parts = dataTree.split(':');
      const articleStr = parts.pop(); // last segment: 'st5', 'rz17', 'pu1', etc.
      const childParts = parts.reverse(); // e.g. ['pu1', 'pp1'] or ['ch_1', 'pu1']
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
        // BE-3: Avoid double-prefix when sectionBase already ends with articleStr
        // e.g. sectionBase = '2019-19.rz17', articleStr = 'rz17' → keep sectionBase as-is
        if (sectionBase && sectionBase.endsWith(`.${articleStr}`)) {
          baseCode = sectionBase;
        } else {
          baseCode = sectionBase ? `${sectionBase}.${articleStr}` : articleStr;
        }
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
        const numberMatch = leafNodeStr ? leafNodeStr.match(/\d+/) : null;
        partNumber = numberMatch ? numberMatch[0] : '';
      }

      // BE-1: Increment global order counter for every child element so that
      // each element in the law gets a unique, strictly-increasing sequence number.
      order++;
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

  return {
    title,
    code,
    elements,
    preamble,
    status,
    signatory,
    adoptedDate,
    documentType,
    global_context,
  };
};
