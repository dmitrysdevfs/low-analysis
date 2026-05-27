import * as roadmapService from './roadmap.service.js';

export async function getRoadmap(req, res, next) {
  try {
    const data = await roadmapService.getRoadmap();
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

export async function updateRoadmap(req, res, next) {
  try {
    const data = await roadmapService.updateRoadmap(
      req.body,
      req.user?._id ?? null,
    );
    return res.json(data);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
}
