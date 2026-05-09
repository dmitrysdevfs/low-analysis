import * as lawService from '../services/lawService.js';

export const getAllLaws = async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const laws = await lawService.getAllLaws(q);
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
