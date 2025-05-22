const express = require('express');
const { check } = require('express-validator');
const { 
  getUserCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  addManhwaToCategory, 
  removeManhwaFromCategory 
} = require('../controllers/categoryController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/categories
// @desc    Get user categories
// @access  Private
router.get('/', auth, getUserCategories);

// @route   POST /api/categories
// @desc    Create new category
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('name', 'Name must be between 2 and 30 characters').isLength({ min: 2, max: 30 })
    ]
  ],
  createCategory
);

// @route   PUT /api/categories/:categoryId
// @desc    Update category
// @access  Private
router.put(
  '/:categoryId',
  [
    auth,
    [
      check('name', 'Name must be between 2 and 30 characters').optional().isLength({ min: 2, max: 30 })
    ]
  ],
  updateCategory
);

// @route   DELETE /api/categories/:categoryId
// @desc    Delete category
// @access  Private
router.delete('/:categoryId', auth, deleteCategory);

// @route   POST /api/categories/:categoryId/manhwa
// @desc    Add manhwa to category
// @access  Private
router.post(
  '/:categoryId/manhwa',
  [
    auth,
    [
      check('manhwaId', 'Manhwa ID is required').not().isEmpty()
    ]
  ],
  addManhwaToCategory
);

// @route   DELETE /api/categories/:categoryId/manhwa/:manhwaId
// @desc    Remove manhwa from category
// @access  Private
router.delete('/:categoryId/manhwa/:manhwaId', auth, removeManhwaFromCategory);

module.exports = router;