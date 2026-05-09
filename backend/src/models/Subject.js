import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  aliases: [{
    type: String,
  }],
  elementIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Element',
  }],
  lawIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Law',
  }],
}, {
  timestamps: true,
});

const Subject = mongoose.model('Subject', subjectSchema);

export default Subject;
