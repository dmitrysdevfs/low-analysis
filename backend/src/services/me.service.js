import User from '../models/User.js';
import SavedArticle from '../models/SavedArticle.js';
import UserFocusTopic from '../models/UserFocusTopic.js';

// ── Preferences ──────────────────────────────────────────────────────────────

export const getPreferences = async (userId) => {
  const user = await User.findById(userId).select('preferences').lean();
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return user.preferences ?? {};
};

export const updatePreferences = async (userId, patch) => {
  const allowed = [
    'emailAlerts',
    'searchHighlights',
    'compactMode',
    'weeklyDigest',
  ];
  const update = {};
  for (const key of allowed) {
    if (patch[key] !== undefined) update[`preferences.${key}`] = patch[key];
  }
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true, select: 'preferences' },
  );
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return user.preferences;
};

// ── Saved Articles ────────────────────────────────────────────────────────────

export const getSavedArticles = async (userId) => {
  return SavedArticle.find({ userId }).sort({ createdAt: -1 }).lean();
};

export const createSavedArticle = async (userId, data) => {
  const existing = await SavedArticle.findOne({
    userId,
    lawId: data.lawId,
    code: data.code,
  });
  if (existing) return existing;
  return SavedArticle.create({ userId, ...data });
};

export const deleteSavedArticle = async (userId, id) => {
  const result = await SavedArticle.deleteOne({ _id: id, userId });
  if (result.deletedCount === 0) {
    const err = new Error('Saved article not found');
    err.status = 404;
    throw err;
  }
};

export const bulkCreateSavedArticles = async (userId, items) => {
  if (!items?.length) return [];
  if (items.length > 200) {
    const err = new Error('Забагато елементів (максимум 200)');
    err.status = 400;
    throw err;
  }
  const docs = items.map((item) => ({
    userId,
    lawId: item.lawId,
    title: item.title,
    code: item.code,
    note: item.note ?? '',
    tags: item.tags ?? [],
  }));
  return SavedArticle.insertMany(docs, { ordered: false });
};

// ── Focus Topics ──────────────────────────────────────────────────────────────

export const getFocusTopics = async (userId) => {
  return UserFocusTopic.find({ userId }).sort({ createdAt: -1 }).lean();
};

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const createFocusTopic = async (userId, label) => {
  const normalized = label.trim();
  if (normalized.length < 2) {
    const err = new Error('Label too short');
    err.status = 400;
    throw err;
  }
  if (normalized.length > 200) {
    const err = new Error('Label too long (max 200)');
    err.status = 400;
    throw err;
  }
  const existing = await UserFocusTopic.findOne({
    userId,
    label: { $regex: `^${escapeRegex(normalized)}$`, $options: 'i' },
  });
  if (existing) return existing;
  return UserFocusTopic.create({ userId, label: normalized });
};

export const deleteFocusTopic = async (userId, id) => {
  const result = await UserFocusTopic.deleteOne({ _id: id, userId });
  if (result.deletedCount === 0) {
    const err = new Error('Focus topic not found');
    err.status = 404;
    throw err;
  }
};

export const bulkCreateFocusTopics = async (userId, topics) => {
  if (!topics?.length) return [];
  if (topics.length > 100) {
    const err = new Error('Забагато тем (максимум 100)');
    err.status = 400;
    throw err;
  }
  const docs = topics.map((t) => ({ userId, label: t.label ?? t }));
  return UserFocusTopic.insertMany(docs, { ordered: false });
};
