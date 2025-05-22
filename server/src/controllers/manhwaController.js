const { validationResult } = require('express-validator');
const ManhwaProgress = require('../models/ManhwaProgress');
const User = require('../models/User');
const { 
  getMangaById, 
  searchManga, 
  getMangaChapters, 
  getChapterPages 
} = require('../utils/mangadexUtils');
const { EXP_REWARDS } = require('../utils/experienceUtils');

// Search manhwas
const searchManhwas = async (req, res, next) => {
  try {
    const { query, limit = 20, offset = 0 } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const results = await searchManga(query, parseInt(limit), parseInt(offset));
    res.json(results);
  } catch (error) {
    next(error);
  }
};

// Get manhwa details
const getManhwaDetails = async (req, res, next) => {
  try {
    const { manhwaId } = req.params;
    
    // Get manga details from MangaDex
    const manga = await getMangaById(manhwaId);
    
    // If authenticated, get user progress
    let userProgress = null;
    if (req.user) {
      userProgress = await ManhwaProgress.findOne({
        user: req.user.id,
        manhwaId
      });
    }
    
    res.json({
      manga,
      userProgress
    });
  } catch (error) {
    next(error);
  }
};

// Get manhwa chapters
const getManhwaChapters = async (req, res, next) => {
  try {
    const { manhwaId } = req.params;
    const { lang = 'en', limit = 100, offset = 0 } = req.query;
    
    const chapters = await getMangaChapters(
      manhwaId, 
      lang, 
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json(chapters);
  } catch (error) {
    next(error);
  }
};

// Get chapter pages
const getChapterContent = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    
    const pages = await getChapterPages(chapterId);
    res.json(pages);
  } catch (error) {
    next(error);
  }
};

// Update reading progress
const updateReadingProgress = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { manhwaId } = req.params;
    const { 
      lastChapterRead, 
      isCompleted, 
      rating,
      review,
      status,
      isLiked
    } = req.body;
    
    // Get manga details to ensure it exists and get title
    const manga = await getMangaById(manhwaId);
    
    // Find existing progress or create new
    let progress = await ManhwaProgress.findOne({
      user: req.user.id,
      manhwaId
    });
    
    let expGained = 0;
    let message = 'Reading progress updated';
    
    if (progress) {
      // Update existing progress
      const updateFields = {};
      
      if (lastChapterRead !== undefined) {
        updateFields.lastChapterRead = lastChapterRead;
      }
      
      if (isCompleted !== undefined) {
        // Award exp for completing a manhwa if not previously completed
        if (isCompleted && !progress.isCompleted) {
          expGained += EXP_REWARDS.READ_MANHWA;
          message = 'Manhwa completed! +50 EXP';
        }
        updateFields.isCompleted = isCompleted;
      }
      
      if (rating !== undefined) {
        // Award exp for rating if not rated before
        if (rating > 0 && progress.rating === 0) {
          expGained += EXP_REWARDS.RATE_MANHWA;
          message = `${message} | Rated a manhwa! +5 EXP`;
        }
        updateFields.rating = rating;
      }
      
      if (review !== undefined) {
        // Award exp for review if not reviewed before
        if (review && !progress.review) {
          expGained += EXP_REWARDS.WRITE_REVIEW;
          message = `${message} | Review added! +20 EXP`;
        }
        updateFields.review = review;
      }
      
      if (status !== undefined) {
        updateFields.status = status;
      }
      
      if (isLiked !== undefined) {
        updateFields.isLiked = isLiked;
      }
      
      // Update experience gained
      if (expGained > 0) {
        updateFields.experienceGained = progress.experienceGained + expGained;
      }
      
      progress = await ManhwaProgress.findOneAndUpdate(
        { user: req.user.id, manhwaId },
        { $set: updateFields },
        { new: true }
      );
    } else {
      // Create new progress
      progress = new ManhwaProgress({
        user: req.user.id,
        manhwaId,
        title: manga.title,
        coverImage: manga.coverImage,
        lastChapterRead: lastChapterRead || 0,
        isCompleted: isCompleted || false,
        rating: rating || 0,
        review: review || '',
        status: status || 'reading',
        isLiked: isLiked || false
      });
      
      // Award exp for starting a new manhwa
      expGained = 10; // Small bonus for starting
      progress.experienceGained = expGained;
      message = 'Manhwa added to your list! +10 EXP';
      
      await progress.save();
    }
    
    // Update user experience if exp was gained
    if (expGained > 0) {
      const user = await User.findById(req.user.id);
      user.addExperience(expGained);
      await user.save();
    }
    
    res.json({
      progress,
      expGained,
      message
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchManhwas,
  getManhwaDetails,
  getManhwaChapters,
  getChapterContent,
  updateReadingProgress
};