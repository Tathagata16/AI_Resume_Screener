const JobDescription = require('../models/JobDescription');

// Helper to clean array fields
const parseStringArray = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(item => item.trim()).filter(Boolean);
  return input.split(',').map(item => item.trim()).filter(Boolean);
};

// @desc    Create a new job description
// @route   POST /api/jobs
// @access  Private
const createJobDescription = async (req, res) => {
  const {
    jobTitle,
    company,
    experienceRequired,
    requiredSkills,
    preferredSkills,
    responsibilities,
    niceToHaveSkills,
    additionalNotes,
  } = req.body;

  try {
    if (!jobTitle || !company) {
      return res.status(400).json({ message: 'Job title and company are required fields' });
    }

    const job = await JobDescription.create({
      recruiterId: req.user.id,
      jobTitle,
      company,
      experienceRequired: experienceRequired || '',
      requiredSkills: parseStringArray(requiredSkills),
      preferredSkills: parseStringArray(preferredSkills),
      responsibilities: parseStringArray(responsibilities),
      niceToHaveSkills: parseStringArray(niceToHaveSkills),
      additionalNotes: additionalNotes || '',
    });

    return res.status(201).json(job);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get recruiter's job descriptions
// @route   GET /api/jobs
// @access  Private
const getJobDescriptions = async (req, res) => {
  try {
    const jobs = await JobDescription.find({ recruiterId: req.user.id }).sort({ createdAt: -1 });
    return res.json(jobs);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single job description by ID
// @route   GET /api/jobs/:id
// @access  Private
const getJobDescriptionById = async (req, res) => {
  try {
    const job = await JobDescription.findOne({ _id: req.params.id, recruiterId: req.user.id });
    if (!job) {
      return res.status(404).json({ message: 'Job description not found' });
    }
    return res.json(job);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a job description
// @route   DELETE /api/jobs/:id
// @access  Private
const deleteJobDescription = async (req, res) => {
  try {
    const job = await JobDescription.findOne({ _id: req.params.id, recruiterId: req.user.id });
    if (!job) {
      return res.status(404).json({ message: 'Job description not found' });
    }

    await job.deleteOne();
    return res.json({ success: true, message: 'Job description deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createJobDescription,
  getJobDescriptions,
  getJobDescriptionById,
  deleteJobDescription,
};
