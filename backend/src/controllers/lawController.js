import * as lawService from '../services/lawService.js';
import { parseAndSaveLawByUrl } from '../services/lawIngest.service.js';
import {
  getLawsQuerySchema,
  formatZodError,
} from '../validation/lawSchemas.js';

export const getAllLaws = async (req, res, next) => {
  try {
    const parsed = getLawsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: formatZodError(parsed.error) });
    }

    const {
      q,
      wordField,
      sortBy,
      sortOrder,
      status,
      documentType,
      dateFrom,
      dateTo,
      page,
      limit,
    } = parsed.data;

    const result = await lawService.getAllLaws({
      q,
      searchIn: wordField,
      sortBy,
      sortOrder,
      status,
      documentType,
      dateFrom,
      dateTo,
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

export const getLawArticles = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await lawService.getLawStructure(id);
    if (!result) return res.status(404).json({ message: 'Law not found' });
    res.json(result);
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

    const result = await parseAndSaveLawByUrl(url);

    res.json({
      message: 'Law successfully parsed and saved',
      lawId: result.lawId,
      elementsCount: result.elementsCount,
    });
  } catch (error) {
    next(error);
  }
};
