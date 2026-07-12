const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createJobDescription,
  getJobDescriptions,
  getJobDescriptionById,
  deleteJobDescription,
} = require('../controllers/jobController');

router.post('/', protect, createJobDescription);
router.get('/', protect, getJobDescriptions);
router.get('/:id', protect, getJobDescriptionById);
router.delete('/:id', protect, deleteJobDescription);

module.exports = router;
