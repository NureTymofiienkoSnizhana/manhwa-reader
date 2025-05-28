const express = require('express');
const { check } = require('express-validator');
const { 
  getAllUsers, 
  getLevelTasks, 
  updateLevelTask, 
  deleteLevelTask,
  updateUserRole,
  searchUsers,
  deleteUser
} = require('../controllers/adminController');
const {
  getActiveBans,
  getBanHistory,
  banUser,
  unbanUser
} = require('../controllers/banController');
const {
  getPlatformStatistics,
  getTopReaders,
  getTopLevelUsers
} = require('../controllers/statisticsController');
const { auth, checkRole } = require('../middleware/auth');

const router = express.Router();

// Admin middleware
const adminOnly = [auth, checkRole(['admin'])];

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', adminOnly, getAllUsers);

// @route   GET /api/admin/level-tasks
// @desc    Get all level tasks
// @access  Private/Admin
router.get('/level-tasks', adminOnly, getLevelTasks);

// @route   POST /api/admin/level-tasks/:level
// @desc    Create or update level task
// @access  Private/Admin
router.post('/level-tasks/:level', adminOnly, updateLevelTask);

// @route   DELETE /api/admin/level-tasks/:level
// @desc    Delete level task
// @access  Private/Admin
router.delete('/level-tasks/:level', adminOnly, deleteLevelTask);

// @route   GET /api/admin/bans/active
// @desc    Get active bans
// @access  Private/Admin
router.get('/bans/active', adminOnly, getActiveBans);

// @route   GET /api/admin/bans/history
// @desc    Get ban history
// @access  Private/Admin
router.get('/bans/history', adminOnly, getBanHistory);

// @route   POST /api/admin/bans/:userId
// @desc    Ban user
// @access  Private/Admin
router.post('/ban', [
  ...adminOnly,
  check('userId', 'User ID is required').not().isEmpty(),
  check('reason', 'Reason is required').not().isEmpty(),
  check('banDuration', 'Ban duration is required').isIn(['1d', '3d', '7d', '30d', 'permanent'])
], banUser);

// @route   DELETE /api/admin/ban/:userId
// @desc    Delete ban for user
// @access  Private/Admin
router.delete('/ban/:userId', adminOnly, unbanUser);

// @route   GET /api/admin/statistics
// @desc    Get platform statistics
// @access  Private/Admin
router.get('/statistics', adminOnly, getPlatformStatistics);

// @route   GET /api/admin/statistics/top-readers
// @desc    Get top readers
// @access  Private/Admin
router.get('/statistics/top-readers', adminOnly, getTopReaders);

// @route   GET /api/admin/statistics/top-levels
// @desc    Get top level users
// @access  Private/Admin
router.get('/statistics/top-levels', adminOnly, getTopLevelUsers);

// @route   GET /api/admin/users/search
// @desc    Search users by username or email
// @access  Private/Admin
router.get('/users/search', adminOnly, searchUsers);

// @route   DELETE /api/admin/users/:userId
// @desc    Delete user
// @access  Private/Admin
router.delete('/users/:userId', adminOnly, deleteUser);

// @route   PUT /api/admin/users/role
// @desc    Update user role
// @access  Private/Admin
router.put('/users/role', [
  adminOnly,
  [
    check('userId', 'User ID is required').not().isEmpty(),
    check('role', 'Valid role is required').isIn(['reader', 'translator', 'admin'])
  ]
], updateUserRole);

module.exports = router;