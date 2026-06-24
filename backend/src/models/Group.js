import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    joinedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  },
  { _id: false },
);

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    course: { type: String, trim: true },
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: [memberSchema],
    trackedLaws: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Law' }],
    maxMembers: { type: Number, default: 20 },
    status: {
      type: String,
      enum: ['active', 'closed', 'archived'],
      default: 'active',
    },
    visibility: {
      type: String,
      enum: ['public', 'invite_only'],
      default: 'public',
    },
  },
  { timestamps: true },
);

groupSchema.index({ supervisorId: 1, status: 1 });
groupSchema.index({ status: 1, visibility: 1 });

export default mongoose.model('Group', groupSchema);
