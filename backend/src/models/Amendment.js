import mongoose from 'mongoose';

const amendmentSchema = new mongoose.Schema(
  {
    law_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Law',
      required: true,
      index: true,
    },
    element_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Element',
      required: true,
      index: true,
    },
    proposal_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      default: null,
      index: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    change_type: {
      type: String,
      enum: ['edit', 'add', 'delete'],
      required: true,
    },
    original_text: { type: String },
    proposed_text: { type: String },
    reason: { type: String },
    context: {
      section_title: String,
      article_num: String,
      article_title: String,
      element_code: String,
    },
    votes_summary: {
      positive: { type: Number, default: 0 },
      neutral: { type: Number, default: 0 },
      negative: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

const Amendment = mongoose.model('Amendment', amendmentSchema);
export default Amendment;
