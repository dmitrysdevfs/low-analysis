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
      enum: ['section', 'article', 'part', 'point', 'sub_point', 'paragraph'],
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
    chars_count: {
      type: Number,
      default: 0,
    },
    subjects_count: {
      type: Number,
      default: 0,
    },
    z_score: {
      type: Number,
      default: 0,
    },
    risk_level: {
      type: String,
      enum: ['green', 'yellow', 'red', null],
      default: null,
    },
    taxonomy: {
      legalFunctions: [{ type: String }],
      domains: [{ type: String }],
      keywords: [{ type: String, trim: true }],
      confidence: { type: Number, default: 1.0 },
      source: {
        type: String,
        enum: ['rules', 'llm', 'manual'],
        default: 'rules',
      },
    },
    /**
     * Regulatory subjects identified by LLM (Semantic Role Labeling).
     * Each entry references the global Subject registry.
     */
    subjects: [
      {
        subject_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
          required: true,
        },
        role: {
          type: String,
          enum: [
            'actor',
            'target_of_control',
            'recipient',
            'regulator',
            'protected_party',
            'issuer_of_regulations',
            'other',
          ],
          default: 'other',
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Element = mongoose.model('Element', elementSchema);

export default Element;
