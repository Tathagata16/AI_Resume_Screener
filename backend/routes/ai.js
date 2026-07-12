const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { triggerDirectRank } = require('../controllers/comparisonController');

router.post('/rank', protect, triggerDirectRank);

module.exports = router;
