import mongoose from 'mongoose';

const lawReferenceSchema = new mongoose.Schema({
  fromLaw: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Law',
    required: true,
  },
  fromArticle: {
    type: String,
  },
  toLaw: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Law',
    default: null,
  },
  toLawTitle: {
    type: String,
  },
  toArticle: {
    type: String,
    default: null,
  },
  type: {
    type: String,
    enum: ['direct', 'blanket', 'reflexive', 'subject'],
    default: 'direct',
  },
  rawText: {
    type: String,
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.7,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

lawReferenceSchema.index({ fromLaw: 1 });
lawReferenceSchema.index({ toLaw: 1 });
lawReferenceSchema.index({ fromLaw: 1, toLaw: 1 });

const LawReference = mongoose.model('LawReference', lawReferenceSchema);

export default LawReference;
