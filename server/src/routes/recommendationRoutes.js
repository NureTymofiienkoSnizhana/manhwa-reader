const express = require('express');
const { 
  getRecommendations, 
  getSearchSuggestions 
} = require('../controllers/recommendationController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/recommendations
// @desc    Get personalized recommendations
// @access  Private
router.get('/', auth, getRecommendations);

// @route   GET /api/recommendations/search-suggestions
// @desc    Get search suggestions
// @access  Public
router.get('/search-suggestions', getSearchSuggestions);

module.exports = router;