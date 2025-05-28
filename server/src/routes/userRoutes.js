const express = require('express');
const { 
  getUserProfile, 
  getUserReadingHistory,
  updateUserRole
} = require('../controllers/userController');
const { auth, checkRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, getUserProfile);

// @route   GET /api/users/profile/:userId
// @desc    Get user profile by ID
// @access  Private
router.get('/profile/:userId', auth, getUserProfile);

// @route   GET /api/users/reading-history
// @desc    Get user reading history
// @access  Private
router.get('/reading-history', auth, getUserReadingHistory);

module.exports = router;