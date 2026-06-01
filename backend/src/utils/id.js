import mongoose from 'mongoose';

/**
 * Cast a value to mongoose.Types.ObjectId if it is a valid ObjectId string.
 */
export const castToObjectId = (id) => {
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
};

/**
 * Safely compare two IDs (ObjectId or string).
 * Uses Mongoose's equals method if available, otherwise falls back to toString() comparison.
 */
export const compareIds = (id1, id2) => {
  if (!id1 || !id2) return false;

  const o1 = castToObjectId(id1);
  const o2 = castToObjectId(id2);

  if (o1 && typeof o1.equals === 'function') {
    return o1.equals(o2);
  }
  if (o2 && typeof o2.equals === 'function') {
    return o2.equals(o1);
  }

  return o1.toString() === o2.toString();
};
