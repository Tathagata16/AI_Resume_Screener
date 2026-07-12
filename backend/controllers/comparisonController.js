const axios = require('axios');
const Comparison = require('../models/Comparison');
const JobDescription = require('../models/JobDescription');
const Resume = require('../models/Resume');

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';

// Helper to validate and fetch job and resumes, then call FastAPI ranker
const performRanking = async (jobDescriptionId, resumeIds, recruiterId) => {
  // 1. Fetch Job Description
  const job = await JobDescription.findOne({ _id: jobDescriptionId, recruiterId });
  if (!job) {
    throw new Error('Job description not found');
  }

  // 2. Fetch Resumes
  if (!Array.isArray(resumeIds) || resumeIds.length === 0) {
    throw new Error('Please select at least one resume to rank');
  }
  if (resumeIds.length > 15) {
    throw new Error('Maximum of 15 resumes can be ranked in a single comparison');
  }

  const resumes = await Resume.find({
    _id: { $in: resumeIds },
    recruiterId,
  });

  if (resumes.length !== resumeIds.length) {
    throw new Error('Some resumes were not found or do not belong to you');
  }

  // 3. Construct FastAPI Payload
  const payload = {
    jobDescription: {
      jobTitle: job.jobTitle,
      company: job.company || '',
      experienceRequired: job.experienceRequired || '',
      requiredSkills: job.requiredSkills || [],
      preferredSkills: job.preferredSkills || [],
      responsibilities: job.responsibilities || [],
      niceToHaveSkills: job.niceToHaveSkills || [],
      additionalNotes: job.additionalNotes || '',
    },
    candidates: resumes.map((resume) => ({
      resumeId: resume._id.toString(),
      name: resume.parsedData.candidateName,
    })),
  };

  // 4. Call FastAPI AI Service
  const response = await axios.post(`${FASTAPI_URL}/ai/rank`, payload);
  return {
    rankingResult: response.data.ranking,
    aiSummary: response.data.summary,
  };
};

// @desc    Perform candidate ranking and save to comparison history
// @route   POST /api/comparisons
// @access  Private
const createComparison = async (req, res) => {
  const { jobDescriptionId, resumeIds } = req.body;

  try {
    if (!jobDescriptionId || !resumeIds) {
      return res.status(400).json({ message: 'jobDescriptionId and resumeIds are required' });
    }

    const { rankingResult, aiSummary } = await performRanking(
      jobDescriptionId,
      resumeIds,
      req.user.id
    );

    // Save to Database
    const comparison = await Comparison.create({
      recruiterId: req.user.id,
      jobDescriptionId,
      resumeIds,
      rankingResult,
      aiSummary,
    });

    return res.status(201).json(comparison);
  } catch (error) {
    console.error('Error creating comparison:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get all comparison histories
// @route   GET /api/comparisons
// @access  Private
const getComparisons = async (req, res) => {
  try {
    const comparisons = await Comparison.find({ recruiterId: req.user.id })
      .populate('jobDescriptionId', 'jobTitle company')
      .sort({ timestamp: -1 });

    return res.json(comparisons);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get detailed comparison result by ID
// @route   GET /api/comparisons/:id
// @access  Private
const getComparisonById = async (req, res) => {
  try {
    const comparison = await Comparison.findOne({ _id: req.params.id, recruiterId: req.user.id })
      .populate('jobDescriptionId')
      .populate({
        path: 'resumeIds',
        select: 'parsedData fileUrl fileName metadata',
      });

    if (!comparison) {
      return res.status(404).json({ message: 'Comparison record not found' });
    }

    return res.json(comparison);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a comparison history record
// @route   DELETE /api/comparisons/:id
// @access  Private
const deleteComparison = async (req, res) => {
  try {
    const comparison = await Comparison.findOne({ _id: req.params.id, recruiterId: req.user.id });
    if (!comparison) {
      return res.status(404).json({ message: 'Comparison record not found' });
    }

    await comparison.deleteOne();
    return res.json({ success: true, message: 'Comparison history deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Direct ranking trigger (returns ranking results without saving to history)
// @route   POST /api/ai/rank
// @access  Private
const triggerDirectRank = async (req, res) => {
  const { jobDescriptionId, resumeIds } = req.body;

  try {
    if (!jobDescriptionId || !resumeIds) {
      return res.status(400).json({ message: 'jobDescriptionId and resumeIds are required' });
    }

    const results = await performRanking(jobDescriptionId, resumeIds, req.user.id);
    return res.json(results);
  } catch (error) {
    console.error('Error triggering ranking:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createComparison,
  getComparisons,
  getComparisonById,
  deleteComparison,
  triggerDirectRank,
};
