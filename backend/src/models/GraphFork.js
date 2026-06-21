import mongoose from 'mongoose';

const graphForkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    viewState: {
      centerLawId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Law',
        default: null,
      },
      depth: { type: Number, default: 1, min: 1, max: 3 },
      nodePositions: [
        {
          lawId: { type: String, required: true },
          x: { type: Number, required: true },
          y: { type: Number, required: true },
        },
      ],
      highlightedNodeIds: [{ type: String }],
      highlightedEdgeIds: [{ type: String }],
      notes: [
        {
          lawId: { type: String, required: true },
          text: { type: String, required: true },
        },
      ],
      userEdges: [
        {
          id: { type: String, required: true },
          source: { type: String, required: true },
          target: { type: String, required: true },
        },
      ],
      visibleLawIds: [{ type: String }],
    },
    filters: {
      edgeTypes: [
        {
          type: String,
          enum: ['direct', 'blanket', 'reflexive', 'subject'],
        },
      ],
      minConfidence: { type: Number, default: 0, min: 0, max: 1 },
      subjectIds: [{ type: String }],
      focusMode: { type: String, enum: ['global', 'focus'], default: 'global' },
    },
    pathState: {
      fromLawId: { type: String, default: null },
      toLawId: { type: String, default: null },
      resultPath: [{ type: String }],
    },
    isPublic: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

graphForkSchema.index({ userId: 1, createdAt: -1 });

const GraphFork = mongoose.model('GraphFork', graphForkSchema);
export default GraphFork;
