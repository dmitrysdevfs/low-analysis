import * as lawService from '../services/lawService.js';
import * as fetchService from '../services/fetchService.js';
import { parseLawHtml } from '../services/parserService.js';
import { performStatisticalAnalysis } from '../services/statisticalAnalysisService.js';
import { classifyElement } from '../services/taxonomyService.js';

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

    const documentType =
      typeof req.query.documentType === 'string'
        ? req.query.documentType.trim()
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

    const page = parseInt(req.query.page ?? '1', 10);
    const limit = parseInt(req.query.limit ?? '20', 10);

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        message: 'Invalid page value. Must be a positive integer',
      });
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        message: 'Invalid limit value. Must be between 1 and 100',
      });
    }

    const result = await lawService.getAllLaws({
      q,
      sortBy,
      sortOrder,
      status,
      dateFrom,
      dateTo,
      documentType,
      page,
      limit,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getLawTree = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { function: legalFunction, domain, subjectId } = req.query;

    const law = await lawService.getLawById(id);
    if (!law) return res.status(404).json({ message: 'Law not found' });

    const elements = await lawService.getLawTree(id, {
      legalFunction,
      domain,
      subjectId,
    });
    res.json({ law, elements });
  } catch (error) {
    next(error);
  }
};

export const getLawStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const stats = await lawService.getLawStats(id);
    if (!stats)
      return res.status(404).json({ message: 'Stats not found for this law' });

    res.json(stats);
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

export const getElement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const element = await lawService.getElement(id);
    if (!element) return res.status(404).json({ message: 'Element not found' });
    res.json(element);
  } catch (error) {
    next(error);
  }
};

export const getLawHeatmap = async (req, res, next) => {
  try {
    const { id } = req.params;
    const heatmap = await lawService.getLawHeatmap(id);
    if (!heatmap)
      return res.status(404).json({ message: 'Heatmap data not found' });
    res.json(heatmap);
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

    // Apply rule-based taxonomy classification
    if (parsedData.elements) {
      parsedData.elements = parsedData.elements.map((el) => ({
        ...el,
        taxonomy: classifyElement(el),
      }));
    }

    if (!parsedData.code) parsedData.code = code;
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
      documentType: parsedData.documentType,
      global_context: parsedData.global_context,
    });

    // 4. Attach lawId, generate _id, and link parentId
    const { elementsToSave, activeCodes } =
      await lawService.resolveElementHierarchy(law._id, parsedData.elements);

    await lawService.bulkUpsertElements(elementsToSave);
    await lawService.deleteMissingElements(law._id, activeCodes);

    // 5. Update law stats from the actual DB state (BE-2).
    // This runs AFTER bulk write + delete so counts reflect reality,
    // and filters out "{...виключено...}" placeholders (BE-4 Option B).
    await lawService.updateLawStatsFromDb(law._id);

    // 6. Calculate statistical metrics
    try {
      await performStatisticalAnalysis(law._id);
    } catch (statsError) {
      console.warn(
        `[WARN] Failed to calculate statistics for law ${law._id}: ${statsError.message}`,
      );
    }

    res.json({
      message: 'Law successfully parsed and saved',
      lawId: law._id,
      elementsCount: elementsToSave.length,
    });
  } catch (error) {
    next(error);
  }
};
