import UserActivity from '../models/UserActivity.js';

export const trackEvent = async (userId, { type, path, query, lawId, meta } = {}) => {
  return UserActivity.create({ userId, type, path, query, lawId, meta });
};

export const getUserActivity = async (userId, { limit = 50, skip = 0, type } = {}) => {
  const filter = { userId, ...(type ? { type } : {}) };
  return UserActivity.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const getUserActivityStats = async (userId) => {
  const [pageViews, searches, lawViews] = await Promise.all([
    UserActivity.countDocuments({ userId, type: 'page_view' }),
    UserActivity.countDocuments({ userId, type: 'search' }),
    UserActivity.countDocuments({ userId, type: 'law_view' }),
  ]);
  return { pageViews, searches, lawViews };
};
