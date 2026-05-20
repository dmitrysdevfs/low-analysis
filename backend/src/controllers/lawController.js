import * as lawService from '../services/lawService.js';
import * as fetchService from '../services/fetchService.js';
import { parseLawHtml } from '../services/parserService.js';

const VALID_SORT_BY = ['date', 'title'];
const VALID_SORT_ORDER = ['asc', 'desc'];

export const getAllLaws = async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const sortBy = req.query.sortBy ?? 'date';
    const sortOrder = req.query.sortOrder ?? 'desc';

    if (!VALID_SORT_BY.includes(sortBy)) {
      return res.status(400).json({
        message: `Invalid sortBy value. Allowed: ${VALID_SORT_BY.join(', ')}`,
      });
    }
    if (!VALID_SORT_ORDER.includes(sortOrder)) {
      return res.status(400).json({
        message: `Invalid sortOrder value. Allowed: ${VALID_SORT_ORDER.join(', ')}`,
      });
    }

    const status =
      typeof req.query.status === 'string'
        ? req.query.status.trim()
        : undefined;

    let dateFrom;
    if (req.query.dateFrom !== undefined) {
      dateFrom = new Date(req.query.dateFrom);
      if (isNaN(dateFrom.getTime())) {
        return res.status(400).json({
          message:
            'Invalid dateFrom value. Expected ISO date (e.g. 2020-01-01)',
        });
      }
    }

    let dateTo;
    if (req.query.dateTo !== undefined) {
      dateTo = new Date(req.query.dateTo);
      if (isNaN(dateTo.getTime())) {
        return res.status(400).json({
          message: 'Invalid dateTo value. Expected ISO date (e.g. 2020-12-31)',
        });
      }
    }

    const laws = await lawService.getAllLaws({
      q,
      sortBy,
      sortOrder,
      status,
      dateFrom,
      dateTo,
    });
    res.json(laws);
  } catch (error) {
    next(error);
  }
};

export const getLawTree = async (req, res, next) => {
  try {
    const { id } = req.params;
    const law = await lawService.getLawById(id);
    if (!law) return res.status(404).json({ message: 'Law not found' });

    const elements = await lawService.getLawTree(id);
    res.json({ law, elements });
  } catch (error) {
    next(error);
  }
};

export const getArticle = async (req, res, next) => {
  try {
    const { id, num } = req.params;
    const result = await lawService.getArticle(id, num);
    if (!result) return res.status(404).json({ message: 'Article not found' });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const parseLawFromUrl = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: 'URL or law code is required' });
    }

    const code = fetchService.extractLawCode(url);
    if (!code) {
      return res.status(400).json({
        message: 'Could not extract valid law code from the provided URL',
      });
    }

    // 1. Fetch HTMLs
    const { mainHtml, frameHtml } = await fetchService.fetchLawData(code);

    // 2. Parse HTML
    const parsedData = parseLawHtml(frameHtml, mainHtml);
    if (!parsedData.title || !parsedData.code) {
      return res
        .status(500)
        .json({ message: 'Failed to parse the law. Invalid HTML structure.' });
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
    });

    // 4. Attach lawId, generate _id, and link parentId
    const { elementsToSave, activeCodes } =
      await lawService.resolveElementHierarchy(law._id, parsedData.elements);

    await lawService.bulkUpsertElements(elementsToSave);
    await lawService.deleteMissingElements(law._id, activeCodes);

    // 5. Update law stats
    let articleCount = 0;
    let sectionCount = 0;
    for (const el of parsedData.elements) {
      if (el.type === 'article') {
        articleCount++;
      } else if (el.type === 'section') {
        sectionCount++;
      }
    }
    law.totalArticles = articleCount;
    law.totalSections = sectionCount;
    await law.save();

    res.json({
      message: 'Law successfully parsed and saved',
      lawId: law._id,
      elementsCount: elementsToSave.length,
    });
  } catch (error) {
    next(error);
  }
};
