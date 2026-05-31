import Comment from '../models/Comment.js';

/**
 * Add a comment to an amendment or proposal.
 */
export const addComment = async ({
  target_type,
  target_id,
  created_by,
  text,
}) => {
  return await Comment.create({ target_type, target_id, created_by, text });
};

/**
 * Get comments for a target.
 */
export const getComments = async (target_type, target_id) => {
  return await Comment.find({ target_type, target_id })
    .populate('created_by', 'fullName')
    .sort({ createdAt: 1 });
};

/**
 * Delete a comment.
 */
export const deleteComment = async (commentId, userId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new Error('Comment not found');

  if (comment.created_by.toString() !== userId.toString()) {
    throw new Error('Not authorized to delete this comment');
  }

  return await Comment.findByIdAndDelete(commentId);
};
