import LawFork from '../models/LawFork.js';
import LawChange from '../models/LawChange.js';

export const getForksByUser = async (authorId) => {
  return LawFork.find({ authorId })
    .populate('lawId', 'title code')
    .sort({ updatedAt: -1 })
    .lean();
};

export const getForksByLaw = async (lawId) => {
  return LawFork.find({ lawId, status: { $in: ['review', 'approved'] } })
    .populate('authorId', 'fullName email')
    .sort({ updatedAt: -1 })
    .lean();
};

export const createFork = async (authorId, { lawId, title, description }) => {
  return LawFork.create({
    lawId,
    authorId,
    title,
    description: description ?? '',
  });
};

export const getForkById = async (forkId, authorId = null) => {
  const fork = await LawFork.findById(forkId)
    .populate('lawId', 'title code')
    .populate('authorId', 'fullName email')
    .lean();
  if (!fork) return null;
  if (
    authorId &&
    String(fork.authorId?._id ?? fork.authorId) !== String(authorId)
  )
    return null;
  const changes = await LawChange.find({ forkId }).lean();
  return { ...fork, changes };
};

export const addChange = async (
  forkId,
  authorId,
  { elementId, elementCode, operation, originalText, proposedText, rationale },
) => {
  const fork = await LawFork.findOne({
    _id: forkId,
    authorId,
    status: 'draft',
  });
  if (!fork)
    throw Object.assign(new Error('Fork not found or not editable'), {
      status: 403,
    });
  const existing = await LawChange.findOne({ forkId, elementId });
  if (existing) {
    existing.operation = operation;
    existing.originalText = originalText ?? existing.originalText;
    existing.proposedText = proposedText ?? existing.proposedText;
    existing.rationale = rationale ?? existing.rationale;
    return existing.save();
  }
  return LawChange.create({
    forkId,
    elementId,
    elementCode,
    operation,
    originalText: originalText ?? '',
    proposedText: proposedText ?? '',
    rationale: rationale ?? '',
  });
};

export const submitFork = async (forkId, authorId) => {
  const fork = await LawFork.findOne({
    _id: forkId,
    authorId,
    status: 'draft',
  });
  if (!fork)
    throw Object.assign(new Error('Fork not found or already submitted'), {
      status: 403,
    });
  fork.status = 'review';
  fork.submittedAt = new Date();
  return fork.save();
};

export const getDiff = async (forkId) => {
  const fork = await LawFork.findById(forkId)
    .populate('lawId', 'title code')
    .lean();
  if (!fork) return null;
  const changes = await LawChange.find({ forkId }).lean();
  return {
    fork: {
      _id: fork._id,
      title: fork.title,
      status: fork.status,
      law: fork.lawId,
    },
    changes: changes.map((c) => ({
      elementId: c.elementId,
      elementCode: c.elementCode,
      operation: c.operation,
      originalText: c.originalText,
      proposedText: c.proposedText,
      rationale: c.rationale,
    })),
  };
};
