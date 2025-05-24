// src/routes/userManhwaRoutes.js
const express = require('express');
const { check } = require('express-validator');
const { 
  createUserManhwa,
  uploadCover,
  addChapter,
  uploadPages,
  getUserManhwas,
  getUserManhwaDetails,
  updateUserManhwa,
  deleteUserManhwa
} = require('../controllers/userManhwaController');
const { auth, checkRole } = require('../middleware/auth');

const router = express.Router();

// Перевірка на роль перекладача або адміністратора
const translatorOrAdmin = [auth, checkRole(['translator', 'admin'])];

// @route   POST /api/user-manhwa
// @desc    Create new manhwa
// @access  Private/Translator
router.post(
  '/',
  translatorOrAdmin,
  uploadCover,
  [
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty()
  ],
  createUserManhwa
);

// @route   GET /api/user-manhwa
// @desc    Get user's manhwas
// @access  Private
router.get('/', auth, getUserManhwas);

// @route   GET /api/user-manhwa/:manhwaId
// @desc    Get manhwa details
// @access  Public
router.get('/:manhwaId', getUserManhwaDetails);

// @route   PUT /api/user-manhwa/:manhwaId
// @desc    Update manhwa
// @access  Private/Translator
router.put(
  '/:manhwaId',
  translatorOrAdmin,
  uploadCover,
  updateUserManhwa
);

// @route   DELETE /api/user-manhwa/:manhwaId
// @desc    Delete manhwa
// @access  Private/Translator
router.delete('/:manhwaId', translatorOrAdmin, deleteUserManhwa);

// @route   POST /api/user-manhwa/:manhwaId/chapter
// @desc    Add new chapter
// @access  Private/Translator
router.post(
  '/:manhwaId/chapter',
  translatorOrAdmin,
  uploadPages,
  [
    check('chapterNumber', 'Chapter number is required').not().isEmpty()
  ],
  addChapter
);

// @route   GET /api/user-manhwa/:manhwaId/chapter
// @desc    Get chapters
// @access  Private/Translator
router.get('/:manhwaId/chapters', async (req, res, next) => {
  try {
    const { manhwaId } = req.params;
    
    const chapters = await UserChapter.find({ manhwa: manhwaId })
      .sort({ chapterNumber: 1 });
    
    res.json({ chapters });
  } catch (error) {
    next(error);
  }
});

module.exports = router;