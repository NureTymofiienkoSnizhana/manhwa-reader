const express = require('express');
const { check } = require('express-validator');
const { 
  getManhwaComments, 
  createComment, 
  updateComment, 
  deleteComment, 
  toggleLikeComment 
} = require('../controllers/commentController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/comments/:manhwaId
// @desc    Get comments for a manhwa
// @access  Public/Private (authenticated users see extra info)
router.get('/:manhwaId', getManhwaComments);

// @route   POST /api/comments/:manhwaId
// @desc    Create a new comment
// @access  Private
router.post(
  '/:manhwaId',
  [
    auth,
    [
      check('content', 'Content is required').not().isEmpty(),
      check('content', 'Content must be between 1 and 1000 characters').isLength({ min: 1, max: 1000 })
    ]
  ],
  createComment
);

// @route   PUT /api/comments/:commentId
// @desc    Update a comment
// @access  Private
router.put(
  '/:commentId',
  [
    auth,
    [
      check('content', 'Content is required').not().isEmpty(),
      check('content', 'Content must be between 1 and 1000 characters').isLength({ min: 1, max: 1000 })
    ]
  ],
  updateComment
);

// @route   DELETE /api/comments/:commentId
// @desc    Delete a comment
// @access  Private
router.delete('/:commentId', auth, deleteComment);

// @route   POST /api/comments/:commentId/like
// @desc    Like/unlike a comment
// @access  Private
router.post('/:commentId/like', auth, toggleLikeComment);

module.exports = router;