const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Resume = require('../models/Resume');

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';

// Configure Cloudinary if credentials are provided in env
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Helper to store files locally
const storeLocal = (buffer, filename) => {
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const uniqueName = `${Date.now()}-${filename.replace(/\s+/g, '_')}`;
  const filePath = path.join(uploadDir, uniqueName);
  fs.writeFileSync(filePath, buffer);
  
  // Return the relative endpoint and full path for deletion
  return {
    url: `/uploads/${uniqueName}`,
    key: filePath,
  };
};

// Helper to upload files to Cloudinary
const storeCloudinary = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'resume_screener_docs',
        public_id: `${Date.now()}-${filename.replace(/\.[^/.]+$/, '')}`,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          key: result.public_id,
        });
      }
    );
    uploadStream.end(buffer);
  });
};

// Helper to delete stored files
const deleteFile = async (key) => {
  if (!key) return;
  
  // Check if it's a local file path
  if (fs.existsSync(key)) {
    try {
      fs.unlinkSync(key);
      console.log(`Deleted local file: ${key}`);
    } catch (err) {
      console.error(`Error deleting local file: ${err.message}`);
    }
  } else if (isCloudinaryConfigured) {
    try {
      await cloudinary.uploader.destroy(key, { resource_type: 'raw' });
      console.log(`Deleted Cloudinary file key: ${key}`);
    } catch (err) {
      console.error(`Error deleting Cloudinary file: ${err.message}`);
    }
  }
};

// @desc    Upload resumes, parse them, generate embeddings and save details
// @route   POST /api/resumes/upload
// @access  Private
const uploadResumes = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    if (req.files.length > 15) {
      return res.status(400).json({ message: 'Maximum of 15 resumes allowed per upload session' });
    }

    const uploadedResumes = [];
    const errors = [];

    for (const file of req.files) {
      const resumeId = new mongoose.Types.ObjectId();
      let storageResult;

      // 1. Save original file
      try {
        if (isCloudinaryConfigured) {
          storageResult = await storeCloudinary(file.buffer, file.originalname);
        } else {
          storageResult = storeLocal(file.buffer, file.originalname);
        }
      } catch (err) {
        errors.push({ filename: file.originalname, error: `Storage upload failed: ${err.message}` });
        continue;
      }

      // 2. Call FastAPI Parser & Vector DB
      try {
        const formData = new FormData();
        formData.append('resume_id', resumeId.toString());
        formData.append('file', file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });

        const fastApiRes = await axios.post(`${FASTAPI_URL}/ai/parse`, formData, {
          headers: {
            ...formData.getHeaders(),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });

        const parsedData = fastApiRes.data;

        // 3. Save to MongoDB
        const resume = await Resume.create({
          _id: resumeId,
          recruiterId: req.user.id,
          fileUrl: storageResult.url,
          fileName: file.originalname,
          fileKey: storageResult.key,
          parsedData: {
            candidateName: parsedData.candidateName || 'Unknown Candidate',
            email: parsedData.email || '',
            experience: parsedData.experience || [],
            skills: parsedData.skills || [],
            education: parsedData.education || [],
          },
          metadata: {
            fileSize: file.size,
            fileType: file.mimetype,
          },
        });

        uploadedResumes.push(resume);
      } catch (err) {
        // Cleanup stored file if FastAPI processing fails
        await deleteFile(storageResult.key);
        
        console.error(`FastAPI Parse error for ${file.originalname}:`, err.response?.data || err.message);
        errors.push({
          filename: file.originalname,
          error: `Parsing / Vector indexing failed: ${err.response?.data?.detail || err.message}`,
        });
      }
    }

    return res.status(207).json({
      success: uploadedResumes.length > 0,
      resumes: uploadedResumes,
      errors: errors,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get recruiter's resume library
// @route   GET /api/resumes
// @access  Private
const getResumes = async (req, res) => {
  try {
    const { search, skill } = req.query;
    let query = { recruiterId: req.user.id };

    if (search) {
      query['parsedData.candidateName'] = { $regex: search, $options: 'i' };
    }

    if (skill) {
      query['parsedData.skills'] = { $regex: skill, $options: 'i' };
    }

    const resumes = await Resume.find(query).sort({ 'metadata.uploadDate': -1 });
    return res.json(resumes);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get detailed resume metadata by ID
// @route   GET /api/resumes/:id
// @access  Private
const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, recruiterId: req.user.id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    return res.json(resume);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Delete resume from library, storage, and AI service
// @route   DELETE /api/resumes/:id
// @access  Private
const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, recruiterId: req.user.id });
    
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // 1. Delete vectors and chunks from FastAPI
    try {
      await axios.delete(`${FASTAPI_URL}/ai/resumes/${resume._id}`);
      console.log(`Deleted vectors for resume: ${resume._id}`);
    } catch (err) {
      console.error(`Failed to delete vectors from AI service: ${err.message}`);
      // Continue deletion anyway
    }

    // 2. Delete original document from storage
    await deleteFile(resume.fileKey);

    // 3. Remove database record
    await resume.deleteOne();

    return res.json({ success: true, message: 'Resume deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadResumes,
  getResumes,
  getResumeById,
  deleteResume,
};
