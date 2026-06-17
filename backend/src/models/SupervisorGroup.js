import mongoose from 'mongoose';

const supervisorGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    course: { type: String, default: '', trim: true },
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    memberIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    trackedLawIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Law',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
  },
  { timestamps: true },
);

supervisorGroupSchema.index({ supervisorId: 1, status: 1 });
supervisorGroupSchema.index({ memberIds: 1 });

const SupervisorGroup = mongoose.model('SupervisorGroup', supervisorGroupSchema);

export default SupervisorGroup;
