import * as activityService from '../services/activity.service.js';

export const trackEvent = async (req, res, next) => {
  try {
    const { type, path, query, lawId, meta } = req.body;
    if (!type) return res.status(400).json({ message: 'type is required' });
    const entry = await activityService.trackEvent(req.user._id, {
      type,
      path,
      query,
      lawId,
      meta,
    });
    res.status(201).json({ ok: true, id: entry._id });
  } catch (err) {
    next(err);
  }
};
