import Note from '../models/Note.js';

export const getNotes = async (userId, { limit = 100, type } = {}) => {
  const filter = { userId, ...(type ? { type } : {}) };
  return Note.find(filter)
    .sort({ pinned: -1, createdAt: -1 })
    .limit(limit)
    .lean();
};

export const createNote = async (userId, data) => {
  return Note.create({ userId, ...data });
};

export const updateNote = async (userId, noteId, patch) => {
  const allowed = ['noteText', 'color', 'pinned'];
  const update = {};
  for (const key of allowed) {
    if (patch[key] !== undefined) update[key] = patch[key];
  }
  const note = await Note.findOneAndUpdate(
    { _id: noteId, userId },
    { $set: update },
    { new: true },
  );
  if (!note) {
    const err = new Error('Note not found');
    err.status = 404;
    throw err;
  }
  return note;
};

export const togglePin = async (userId, noteId) => {
  const note = await Note.findOne({ _id: noteId, userId });
  if (!note) {
    const err = new Error('Note not found');
    err.status = 404;
    throw err;
  }
  note.pinned = !note.pinned;
  return note.save();
};

export const deleteNote = async (userId, noteId) => {
  const result = await Note.deleteOne({ _id: noteId, userId });
  if (result.deletedCount === 0) {
    const err = new Error('Note not found');
    err.status = 404;
    throw err;
  }
};

export const bulkCreateNotes = async (userId, notes) => {
  if (!notes?.length) return [];
  const docs = notes.map((n) => ({
    userId,
    type: n.type ?? 'manual',
    color: n.color ?? 'gold',
    noteText: n.noteText ?? '',
    pinned: n.pinned ?? false,
    lawId: n.lawId,
    lawTitle: n.lawTitle,
    articleNum: n.articleNum,
    articleTitle: n.articleTitle,
    selectedText: n.selectedText,
    pageUrl: n.pageUrl,
    pageTitle: n.pageTitle,
  }));
  return Note.insertMany(docs, { ordered: false });
};
