import mongoose from 'mongoose';

const elementSchema = new mongoose.Schema(
  {
    lawId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Law',
      required: true,
    },
    type: {
      type: String,
      enum: ['section', 'article', 'part', 'point', 'paragraph'],
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    number: {
      type: String,
    },
    title: {
      type: String,
    },
    text: {
      type: String,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Element',
      default: null,
    },
    depth: {
      type: Number,
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
    subjects: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Element = mongoose.model('Element', elementSchema);

export default Element;
