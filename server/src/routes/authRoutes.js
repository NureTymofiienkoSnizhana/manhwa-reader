const express = require('express');
const { check } = require('express-validator');
const { 
  register, 
  login, 
  getMe, 
  updatePreferences, 
  updateProfile,
  changePassword 
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    check('username', 'Username is required').not().isEmpty(),
    check('username', 'Username must be between 3 and 20 characters').isLength({ min: 3, max: 20 }),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  register
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  login
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, getMe);

// @route   PUT /api/auth/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', auth, updatePreferences);

// @route   PUT /api/auth/update-profile
// @desc    Update user profile (username, email)
// @access  Private
router.put(
  '/update-profile',
  [
    auth,
    [
      check('username', 'Username is required').not().isEmpty(),
      check('username', 'Username must be between 3 and 20 characters').isLength({ min: 3, max: 20 }),
      check('email', 'Please include a valid email').isEmail()
    ]
  ],
  updateProfile
);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put(
  '/change-password',
  [
    auth,
    [
      check('currentPassword', 'Current password is required').not().isEmpty(),
      check('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
    ]
  ],
  changePassword
);

module.exports = router;