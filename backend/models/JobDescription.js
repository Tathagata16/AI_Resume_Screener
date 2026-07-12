const mongoose = require('mongoose');

const JobDescriptionSchema = new mongoose.Schema({
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  jobTitle: {
    type: String,
    required: [true, 'Please add a job title'],
    trim: true,
  },
  company: {
    type: String,
    required: [true, 'Please add a company name'],
    trim: true,
  },
  experienceRequired: {
    type: String,
    trim: true,
  },
  requiredSkills: {
    type: [String],
    default: [],
  },
  preferredSkills: {
    type: [String],
    default: [],
  },
  responsibilities: {
    type: [String],
    default: [],
  },
  niceToHaveSkills: {
    type: [String],
    default: [],
  },
  additionalNotes: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

JobDescriptionSchema.index({ recruiterId: 1 });

module.exports = mongoose.model('JobDescription', JobDescriptionSchema);
