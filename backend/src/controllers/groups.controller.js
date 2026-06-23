import * as groupsService from '../services/groups.service.js';

export const listPublicGroups = async (req, res, next) => {
  try {
    const { page, limit, search, supervisorId } = req.query;
    const result = await groupsService.getPublicGroups({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      supervisorId,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const createGroup = async (req, res, next) => {
  try {
    const group = await groupsService.createGroup({
      ...req.body,
      supervisorId: req.user._id,
    });
    res.status(201).json(group);
  } catch (error) {
    next(error);
  }
};

export const getMyGroups = async (req, res, next) => {
  try {
    const groups = await groupsService.getMyGroups(req.user._id, req.user.role);
    res.json(groups);
  } catch (error) {
    next(error);
  }
};

export const getMyRequests = async (req, res, next) => {
  try {
    const requests = await groupsService.getMyRequests(req.user._id);
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

export const getGroupById = async (req, res, next) => {
  try {
    const group = await groupsService.getGroupById(req.params.id);
    if (!group) {
      const err = new Error('Group not found');
      err.statusCode = 404;
      return next(err);
    }
    res.json(group);
  } catch (error) {
    next(error);
  }
};

export const updateGroup = async (req, res, next) => {
  try {
    const group = await groupsService.updateGroup(req.params.id, req.user._id, req.body);
    res.json(group);
  } catch (error) {
    next(error);
  }
};

export const archiveGroup = async (req, res, next) => {
  try {
    const group = await groupsService.archiveGroup(req.params.id, req.user._id);
    res.json(group);
  } catch (error) {
    next(error);
  }
};

export const createRequest = async (req, res, next) => {
  try {
    const request = await groupsService.createRequest(
      req.params.id,
      req.user._id,
      req.body.message,
    );
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
};

export const getGroupRequests = async (req, res, next) => {
  try {
    const requests = await groupsService.getGroupRequests(req.params.id, req.user._id);
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

export const reviewRequest = async (req, res, next) => {
  try {
    const request = await groupsService.reviewRequest(
      req.params.id,
      req.params.reqId,
      req.user._id,
      req.body.action,
    );
    res.json(request);
  } catch (error) {
    next(error);
  }
};

export const cancelRequest = async (req, res, next) => {
  try {
    const request = await groupsService.cancelRequest(req.params.reqId, req.user._id);
    res.json(request);
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const group = await groupsService.removeMember(
      req.params.id,
      req.params.userId,
      req.user._id,
    );
    res.json(group);
  } catch (error) {
    next(error);
  }
};

export const getGroupActivity = async (req, res, next) => {
  try {
    const activity = await groupsService.getGroupActivity(req.params.id, req.user._id);
    res.json(activity);
  } catch (error) {
    next(error);
  }
};
