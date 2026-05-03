import * as subjectService from '../services/subjectService.js';

export const getAllSubjects = async (req, res, next) => {
  try {
    const subjects = await subjectService.getAllSubjects();
    res.json(subjects);
  } catch (error) {
    next(error);
  }
};

export const getSubjectElements = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await subjectService.getSubjectElements(id);
    if (!result) return res.status(404).json({ message: 'Subject not found' });

    res.json(result);
  } catch (error) {
    next(error);
  }
};
