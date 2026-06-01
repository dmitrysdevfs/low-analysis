import * as commentService from '../services/commentService.js';

export const addComment = async (req, res, next) => {
  try {
    const comment = await commentService.addComment({
      ...req.body,
      created_by: req.user._id,
    });
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const { target_type, target_id } = req.query;
    if (!target_type || !target_id) {
      const error = new Error('target_type and target_id are required');
      error.statusCode = 400;
      return next(error);
    }
    const comments = await commentService.getComments(target_type, target_id);
    res.json(comments);
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    await commentService.deleteComment(req.params.id, req.user._id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
