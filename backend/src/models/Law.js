import mongoose from 'mongoose';

const lawSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    adoptedDate: {
      type: Date,
    },
    source: {
      type: String,
    },
    totalArticles: {
      type: Number,
      default: 0,
    },
    totalSections: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Law = mongoose.model('Law', lawSchema);

export default Law;
