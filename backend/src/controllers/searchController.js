import * as searchService from '../services/searchService.js';
import {
  searchQuerySchema,
  formatZodError,
} from '../validation/searchSchemas.js';

export const search = async (req, res, next) => {
  try {
    const parsed = searchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: formatZodError(parsed.error) });
    }

    const result = await searchService.search(parsed.data);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
