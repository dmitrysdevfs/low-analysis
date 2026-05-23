import mongoose from 'mongoose';

/**
 * Global Subject registry — single source of truth for all regulatory actors.
 * Elements reference subjects via subjects[].subject_id (ObjectId), not stored here.
 */
const subjectSchema = new mongoose.Schema(
  {
    canonical_name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    legal_status: {
      type: String,
      enum: [
        'executive_body',
        'official',
        'legal_entity',
        'individual',
        'self_regulatory_org',
        'other',
      ],
      default: 'other',
    },
    aliases: [
      {
        type: String,
        trim: true,
      },
    ],
    description: {
      type: String,
      default: null,
    },
    taxonomies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Taxonomy',
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Case-insensitive index for fast lookup by alias
subjectSchema.index({ aliases: 1 });

const Subject = mongoose.model('Subject', subjectSchema);

export default Subject;
