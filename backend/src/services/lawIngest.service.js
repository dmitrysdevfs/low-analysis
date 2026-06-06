import * as lawService from './lawService.js';
import * as fetchService from './fetchService.js';
import { parseLawHtml } from './parserService.js';
import { performStatisticalAnalysis } from './statisticalAnalysisService.js';

export async function parseAndSaveLawByUrl(url) {
  if (!url) {
    const err = new Error('URL or law code is required');
    err.statusCode = 400;
    throw err;
  }

  const code = fetchService.extractLawCode(url);
  if (!code) {
    const err = new Error(
      'Could not extract valid law code from the provided URL',
    );
    err.statusCode = 400;
    throw err;
  }

  // 1. Fetch HTMLs
  const { mainHtml, frameHtml } = await fetchService.fetchLawData(code);

  // 2. Parse HTML
  const parsedData = parseLawHtml(frameHtml, mainHtml);

  if (!parsedData.code) parsedData.code = code;
  if (!parsedData.title || !parsedData.code) {
    const err = new Error('Failed to parse the law. Invalid HTML structure.');
    err.statusCode = 500;
    throw err;
  }

  // 3. Upsert Law
  const law = await lawService.upsertLaw({
    title: parsedData.title,
    code: parsedData.code,
    source: `https://zakon.rada.gov.ua/laws/show/${parsedData.code}#Text`,
    status: parsedData.status,
    preamble: parsedData.preamble,
    signatory: parsedData.signatory,
    adoptedDate: parsedData.adoptedDate,
    documentType: parsedData.documentType,
    global_context: parsedData.global_context,
  });

  // 4. Attach lawId, generate _id, link parentId, then persist elements
  const { elementsToSave, activeCodes } =
    await lawService.resolveElementHierarchy(law._id, parsedData.elements);

  await lawService.bulkUpsertElements(elementsToSave);
  await lawService.deleteMissingElements(law._id, activeCodes);

  // 5. Update law stats from the actual DB state (runs AFTER bulk write +
  // delete so counts reflect reality).
  await lawService.updateLawStatsFromDb(law._id);

  // 6. Calculate statistical metrics — non-fatal: a stats failure must not
  // fail the whole ingest (same behaviour as the original controller).
  try {
    await performStatisticalAnalysis(law._id);
  } catch (statsError) {
    console.warn(
      `[WARN] Failed to calculate statistics for law ${law._id}: ${statsError.message}`,
    );
  }

  return { lawId: law._id, elementsCount: elementsToSave.length };
}
