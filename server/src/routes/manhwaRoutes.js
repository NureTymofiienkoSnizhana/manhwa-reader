const express = require('express');
const { check } = require('express-validator');
const { 
  searchManhwas, 
  getManhwaDetails, 
  getManhwaChapters, 
  getChapterContent,
  updateReadingProgress
} = require('../controllers/manhwaController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/manhwa/search
// @desc    Search manhwas
// @access  Public
router.get('/search', searchManhwas);

// @route   GET /api/manhwa/:manhwaId
// @desc    Get manhwa details
// @access  Public/Private (authenticated gets additional user info)
router.get('/:manhwaId', getManhwaDetails);

// @route   GET /api/manhwa/:manhwaId/chapters
// @desc    Get manhwa chapters
// @access  Public
router.get('/:manhwaId/chapters', getManhwaChapters);

// @route   GET /api/manhwa/chapter/:chapterId
// @desc    Get chapter content
// @access  Public
router.get('/chapter/:chapterId', getChapterContent);

// @route   GET /api/manhwa/popular
// @desc    Get popular manhwas
// @access  Public
router.get('/popular', async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const results = await searchManga('', parseInt(limit), parseInt(offset), {
      order: { followedCount: 'desc' }
    });
    
    res.json(results);
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/manhwa/:manhwaId/progress
// @desc    Update reading progress
// @access  Private
router.post(
  '/:manhwaId/progress',
  [
    auth,
    [
      check('lastChapterRead', 'Last chapter read must be a non-negative number').optional().isInt({ min: 0 }),
      check('isCompleted', 'Is completed must be a boolean').optional().isBoolean(),
      check('rating', 'Rating must be between 0 and 5').optional().isInt({ min: 0, max: 5 }),
      check('status', 'Invalid status').optional().isIn(['reading', 'completed', 'plan_to_read', 'dropped']),
      check('isLiked', 'Is liked must be a boolean').optional().isBoolean()
    ]
  ],
  updateReadingProgress
);

module.exports = router;