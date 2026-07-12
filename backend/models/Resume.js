const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileKey: {
    type: String, // Public ID or local path to delete the file
  },
  parsedData: {
    candidateName: {
      type: String,
      required: true,
      default: 'Unknown Candidate',
    },
    email: {
      type: String,
      default: '',
    },
    experience: {
      type: [String],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    education: {
      type: [String],
      default: [],
    },
  },
  metadata: {
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    fileSize: Number,
    fileType: String,
  },
});

// Add indexing for recruiter and search queries
ResumeSchema.index({ recruiterId: 1 });
ResumeSchema.index({ 'parsedData.candidateName': 'text', 'parsedData.skills': 'text' });

module.exports = mongoose.model('Resume', ResumeSchema);
