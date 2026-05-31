import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    target_type: {
      type: String,
      enum: ['amendment', 'proposal'],
      required: true,
    },
    target_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: { type: String, required: true },
  },
  { timestamps: true },
);

commentSchema.index({ target_type: 1, target_id: 1 });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
