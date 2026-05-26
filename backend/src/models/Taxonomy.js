import mongoose from 'mongoose';

const taxonomySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Taxonomy',
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Taxonomy = mongoose.model('Taxonomy', taxonomySchema);

export default Taxonomy;
