import * as supervisorService from '../services/supervisor.service.js';

export const getDashboard = async (req, res, next) => {
  try {
    const summary = await supervisorService.getDashboardSummary(req.user._id);
    res.json(summary);
  } catch (err) {
    next(err);
  }
};

export const getGroups = async (req, res, next) => {
  try {
    const groups = await supervisorService.getGroupsBySupervisor(req.user._id);
    res.json(groups);
  } catch (err) {
    next(err);
  }
};

export const createGroup = async (req, res, next) => {
  try {
    const group = await supervisorService.createGroup(req.user._id, req.body);
    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
};

export const getGroup = async (req, res, next) => {
  try {
    const group = await supervisorService.getGroupById(
      req.params.id,
      req.user._id,
    );
    res.json(group);
  } catch (err) {
    next(err);
  }
};

export const updateGroup = async (req, res, next) => {
  try {
    const group = await supervisorService.updateGroup(
      req.params.id,
      req.user._id,
      req.body,
    );
    res.json(group);
  } catch (err) {
    next(err);
  }
};
