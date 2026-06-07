import mongoose from 'mongoose';

const savedArticleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lawId: { type: String, required: true },
    title: { type: String, required: true },
    code: { type: String, required: true },
    note: { type: String, default: '' },
    tags: [{ type: String }],
  },
  { timestamps: true },
);

savedArticleSchema.index({ userId: 1, createdAt: -1 });
savedArticleSchema.index({ userId: 1, lawId: 1, code: 1 }, { unique: true });

const SavedArticle = mongoose.model('SavedArticle', savedArticleSchema);
export default SavedArticle;
