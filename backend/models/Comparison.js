const mongoose = require('mongoose');

const ComparisonSchema = new mongoose.Schema({
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  jobDescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobDescription',
    required: true,
  },
  resumeIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
  }],
  rankingResult: [{
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
    },
    rank: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    strengths: [String],
    missingSkills: [String],
    justification: String,
    recommendation: String,
  }],
  aiSummary: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

ComparisonSchema.index({ recruiterId: 1 });

module.exports = mongoose.model('Comparison', ComparisonSchema);
