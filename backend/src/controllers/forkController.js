import * as forkService from '../services/forkService.js';

export const getMyForks = async (req, res, next) => {
  try {
    const forks = await forkService.getForksByUser(req.user._id);
    res.json(forks);
  } catch (err) {
    next(err);
  }
};

export const getLawForks = async (req, res, next) => {
  try {
    const forks = await forkService.getForksByLaw(req.params.lawId);
    res.json(forks);
  } catch (err) {
    next(err);
  }
};

export const createFork = async (req, res, next) => {
  try {
    const fork = await forkService.createFork(req.user._id, req.body);
    res.status(201).json(fork);
  } catch (err) {
    next(err);
  }
};

export const getFork = async (req, res, next) => {
  try {
    const isOwner = req.query.mine === '1';
    const fork = await forkService.getForkById(
      req.params.id,
      isOwner ? req.user._id : null,
    );
    if (!fork) return res.status(404).json({ message: 'Fork not found' });
    res.json(fork);
  } catch (err) {
    next(err);
  }
};

export const addChange = async (req, res, next) => {
  try {
    const change = await forkService.addChange(
      req.params.id,
      req.user._id,
      req.body,
    );
    res.json(change);
  } catch (err) {
    next(err);
  }
};

export const submitFork = async (req, res, next) => {
  try {
    const fork = await forkService.submitFork(req.params.id, req.user._id);
    res.json(fork);
  } catch (err) {
    next(err);
  }
};

export const getForkDiff = async (req, res, next) => {
  try {
    const diff = await forkService.getDiff(req.params.id);
    if (!diff) return res.status(404).json({ message: 'Fork not found' });
    res.json(diff);
  } catch (err) {
    next(err);
  }
};
