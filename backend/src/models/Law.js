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
    preamble: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      default: null,
    },
    signatory: {
      type: String,
      default: null,
    },
    documentType: {
      type: [String],
      default: [],
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
    totalParagraphs: {
      type: Number,
      default: 0,
    },
    /**
     * Structured context extracted for LLM prompts.
     * Especially critical for laws without a preamble or with a malformed one.
     * definitions[] is typically populated from Article 1 ("Визначення термінів").
     */
    global_context: {
      preamble: { type: String, default: null },
      definitions: [
        {
          term: { type: String },
          definition: { type: String },
        },
      ],
    },
  },
  {
    timestamps: true,
  },
);

const Law = mongoose.model('Law', lawSchema);

export default Law;
