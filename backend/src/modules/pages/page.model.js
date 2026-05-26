import mongoose from 'mongoose';
import {
  PAGE_BLOCK_TYPES,
  PAGE_STATUS,
  PAGE_VERSION_KINDS,
} from './page.constants.js';

const pageBlockSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true, enum: PAGE_BLOCK_TYPES },
    enabled: { type: Boolean, default: true },
    variant: { type: String, default: 'default' },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    style: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const pageSnapshotSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    seo: {
      title: { type: String, default: '', trim: true },
      description: { type: String, default: '', trim: true },
      ogImage: { type: String, default: '', trim: true },
    },
    blocks: {
      type: [pageBlockSchema],
      default: [],
    },
  },
  { _id: false },
);

const pageVersionSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true },
    kind: {
      type: String,
      enum: Object.values(PAGE_VERSION_KINDS),
      required: true,
    },
    savedAt: { type: Date, default: Date.now },
    savedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    snapshot: { type: pageSnapshotSchema, required: true },
  },
  { _id: false },
);

const managedPageSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    title: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: Object.values(PAGE_STATUS),
      default: PAGE_STATUS.published,
    },
    draft: { type: pageSnapshotSchema, required: true },
    published: { type: pageSnapshotSchema, default: null },
    versions: { type: [pageVersionSchema], default: [] },
    lastVersion: { type: Number, default: 0 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const ManagedPage =
  mongoose.models.ManagedPage ||
  mongoose.model('ManagedPage', managedPageSchema);

export default ManagedPage;
