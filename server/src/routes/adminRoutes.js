const express = require('express');
const { 
  getAllUsers, 
  getLevelTasks, 
  updateLevelTask, 
  deleteLevelTask 
} = require('../controllers/adminController');
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

module.exports = router;