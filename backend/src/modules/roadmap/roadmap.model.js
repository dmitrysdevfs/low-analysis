import mongoose from 'mongoose';

const roadmapTaskSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { _id: false },
);

const roadmapPhaseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    status: {
      type: String,
      enum: ['done', 'in_progress', 'pending'],
      default: 'pending',
    },
    tasks: { type: [roadmapTaskSchema], default: [] },
  },
  { _id: false },
);

const roadmapItemSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { _id: false },
);

const deferredItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    reason: { type: String, default: '' },
  },
  { _id: false },
);

const decisionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    decision: { type: String, default: '' },
    rationale: { type: String, default: '' },
  },
  { _id: false },
);

const roadmapDocSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    phases: { type: [roadmapPhaseSchema], default: [] },
    roadmapItems: { type: [roadmapItemSchema], default: [] },
    deferredItems: { type: [deferredItemSchema], default: [] },
    decisions: { type: [decisionSchema], default: [] },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
);

const RoadmapDoc =
  mongoose.models.RoadmapDoc || mongoose.model('RoadmapDoc', roadmapDocSchema);

export default RoadmapDoc;
