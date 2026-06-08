import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['article', 'selection', 'manual'],
      default: 'manual',
    },
    color: {
      type: String,
      enum: ['gold', 'blue', 'green'],
      default: 'gold',
    },
    noteText: { type: String, default: '' },
    pinned: { type: Boolean, default: false },
    lawId: { type: String },
    lawTitle: { type: String },
    articleNum: { type: String },
    articleTitle: { type: String },
    selectedText: { type: String },
    pageUrl: { type: String },
    pageTitle: { type: String },
  },
  { timestamps: true },
);

noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, lawId: 1, articleNum: 1 });

const Note = mongoose.model('Note', noteSchema);
export default Note;
