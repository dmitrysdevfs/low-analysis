import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SECTION_CLASS = 'rvps7';
const ARTICLE_CLASS = 'rvps2';
const TITLE_SPAN = 'rvts78';
const SECTION_SPAN = 'rvts15';
const ARTICLE_SPAN = 'rvts9';

// Modified parser function to test fixes
const parsedLawHtmlModified = (html, mainHtml = null) => {
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

  let code = '';
  $('#edition option[selected]').each((_, el) => {
    const href = $(el).attr('value') || '';
    const match = href.match(/\/laws\/show\/(.+?)\/ed/);
    if (match) {
      code = decodeURIComponent(match[1]);
    }
  });

  const elements = [];
  let order = 0; // global order counter
  let currentSectionId = null;
  let currentArticleId = null;

  let preambleText = [];
  let signatoryText = [];
  let hasHitFirstDataTree = false;

  $('#article p').each((_, el) => {
    const $p = $(el);
    const anchor = $p.find('a[data-tree]').first();
    const text = $p.text().trim();

    const dataTree = anchor.length ? anchor.attr('data-tree') || '' : '';
    const anchorName = anchor.length ? anchor.attr('name') || '' : '';

    const isBodyElement =
      dataTree.startsWith('rz') ||
      dataTree.startsWith('st') ||
      dataTree.startsWith('kg') ||
      dataTree.startsWith('kn') ||
      dataTree.startsWith('gl') ||
      dataTree.includes(':st') ||
      dataTree.includes(':rz') || // Added for sections hierarchy support
      dataTree.includes(':pu') || // Added for points hierarchy support
      text.toLowerCase().startsWith('книга ') ||
      text.toLowerCase().startsWith('глава ') ||
      text.toLowerCase().startsWith('розділ ') ||
      text.toLowerCase().startsWith('загальна частина') ||
      text.toLowerCase().startsWith('особлива частина');

    if (isBodyElement) {
      hasHitFirstDataTree = true;
      signatoryText = [];
    }

    if (!hasHitFirstDataTree) {
      const isEditorial = text.startsWith('{') || dataTree.startsWith('cm_');
      const isLawTitleOrType =
        dataTree.startsWith('ty') || dataTree.startsWith('nz');

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
      if (!isBodyElement) {
        return;
      }
    } else {
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

      const number = dataTree.replace('rz', '');
      const sectionCode = code ? `${code}.rz${number}` : `rz${number}`;

      order++; // BE-1: Increment order
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
      currentSectionId = elem;
      currentArticleId = null;
      return;
    }

    // ── Article (Стаття) ──────────────────────────────────────────────────
    if (pClass === ARTICLE_CLASS && dataTree.match(/^st[\d]/)) {
      const articleSpan = $p.find(`.${ARTICLE_SPAN}`);
      if (!articleSpan.length) return;

      const number = dataTree.replace(/^st/, '');
      const spanText = articleSpan.text().trim();
      const title = `Стаття ${number}.`;
      const bodyText = $p.text().trim().replace(spanText, '').trim();

      // BE-4: Skip excluded articles
      const isExcluded =
        (bodyText.startsWith('{') &&
          (bodyText.toLowerCase().includes('виключено') ||
            bodyText.toLowerCase().includes('вилучено'))) ||
        bodyText.toLowerCase().startsWith('виключена на підставі') ||
        (bodyText.toLowerCase().startsWith('{статтю') &&
          bodyText.toLowerCase().includes('виключено'));

      if (isExcluded) {
        currentArticleId = null; // Do not attach subsequent children to excluded article
        return;
      }

      const sectionCode = currentSectionId ? currentSectionId.code : null;
      const articleCode = sectionCode
        ? `${sectionCode}.st${number}`
        : code
          ? `${code}.st${number}`
          : `st${number}`;

      order++; // BE-1: Increment order
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
    // BE-3: Changed dataTree.includes(':st') to dataTree.includes(':') to capture sections/points hierarchy
    if (pClass === ARTICLE_CLASS && dataTree.includes(':')) {
      const parts = dataTree.split(':');
      const articleStr = parts.pop();
      const childParts = parts.reverse();
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
        // BE-3: Avoid duplication like 2019-19.rz17.rz17
        if (sectionBase && sectionBase.endsWith(articleStr)) {
          baseCode = sectionBase;
        } else {
          baseCode = sectionBase ? `${sectionBase}.${articleStr}` : articleStr;
        }
      }

      const partCode = [baseCode, ...childParts].join('.');
      const parentCode = [baseCode, ...childParts.slice(0, -1)].join('.');
      const depth = 1 + childParts.length;

      const leafNodeStr = childParts[childParts.length - 1];

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

      order++; // BE-1: Increment order for child elements too
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

  return { title, code, elements, preamble, status, signatory };
};

function testMarketLaw() {
  console.log('=== Testing Market Law (2019-19) ===');
  const filePath = path.resolve(__dirname, '../data/raw/2019-19.frame.html');
  const html = fs.readFileSync(filePath, 'utf-8');

  const { elements } = parsedLawHtmlModified(html);
  console.log(`Total elements parsed: ${elements.length}`);

  // Find Section XVII
  const rz17 = elements.find(
    (el) => el.type === 'section' && el.code.endsWith('.rz17'),
  );
  if (rz17) {
    console.log(
      `Found Section XVII: ${rz17.code}, title: "${rz17.title}", order: ${rz17.order}`,
    );
    // Find children of rz17 (their parentCode should be rz17 code or start with it)
    const children = elements.filter((el) => el.parentCode === rz17.code);
    console.log(`Direct children of Section XVII count: ${children.length}`);
    children.slice(0, 5).forEach((ch) => {
      console.log(
        `  - Code: ${ch.code}, parentCode: ${ch.parentCode}, type: ${ch.type}, order: ${ch.order}, Text: "${ch.text.substring(0, 60)}"`,
      );
    });

    // Find sub-children (grandchildren)
    const grandchildren = elements.filter(
      (el) => el.parentCode && el.parentCode.startsWith(rz17.code + '.'),
    );
    console.log(`Grandchildren of Section XVII count: ${grandchildren.length}`);
    grandchildren.slice(0, 5).forEach((gc) => {
      console.log(
        `  - Code: ${gc.code}, parentCode: ${gc.parentCode}, type: ${gc.type}, order: ${gc.order}, Text: "${gc.text.substring(0, 60)}"`,
      );
    });
  } else {
    console.log('Section XVII not found in parsed elements!');
  }
}

function testConstitutionExcluded() {
  console.log('\n=== Testing Constitution (254к/96-ВР) ===');
  const filePath = path.resolve(__dirname, '../data/raw/254к_96-ВР_frame.html');
  const html = fs.readFileSync(filePath, 'utf-8');

  const { elements } = parsedLawHtmlModified(html);
  const articles = elements.filter((el) => el.type === 'article');
  console.log(`Total articles parsed: ${articles.length}`);

  // Let's verify if order increases correctly (BE-1)
  const policePath = path.resolve(__dirname, '../data/raw/1667-20.frame.html');
  if (fs.existsSync(policePath)) {
    console.log('\n=== Testing Law 1667-20 order uniqueness (BE-1) ===');
    const phtml = fs.readFileSync(policePath, 'utf-8');
    const pelements = parsedLawHtmlModified(phtml).elements;

    const art100 = pelements.find(
      (el) => el.type === 'article' && el.code.endsWith('.st100'),
    );
    if (art100) {
      console.log(
        `Found Article 100: code=${art100.code}, order=${art100.order}`,
      );
      const children = pelements.filter((el) => el.parentCode === art100.code);
      console.log(`Children of Art 100 count: ${children.length}`);
      children.forEach((ch) => {
        console.log(
          `  - Child Code: ${ch.code}, type: ${ch.type}, order: ${ch.order}`,
        );
      });

      const orders = children.map((c) => c.order);
      const uniqueOrders = new Set(orders);
      console.log(
        `Unique orders count among children: ${uniqueOrders.size} (Expected: ${children.length})`,
      );
    }
  }
}

testMarketLaw();
testConstitutionExcluded();
