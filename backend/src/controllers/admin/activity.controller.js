import * as activityService from '../../services/activity.service.js';

export const getUserActivity = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = parseInt(req.query.skip) || 0;
    const type = req.query.type || null;

    const [entries, stats] = await Promise.all([
      activityService.getUserActivity(userId, { limit, skip, type }),
      activityService.getUserActivityStats(userId),
    ]);

    res.json({ entries, stats });
  } catch (err) {
    next(err);
  }
};
