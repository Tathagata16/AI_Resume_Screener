const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createComparison,
  getComparisons,
  getComparisonById,
  deleteComparison,
} = require('../controllers/comparisonController');

router.post('/', protect, createComparison);
router.get('/', protect, getComparisons);
router.get('/:id', protect, getComparisonById);
router.delete('/:id', protect, deleteComparison);

module.exports = router;
