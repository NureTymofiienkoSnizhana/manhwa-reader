const User = require('../models/User');
const ManhwaProgress = require('../models/ManhwaProgress');
const Category = require('../models/Category');
const LevelTask = require('../models/LevelTask');
const { EXP_REWARDS, calculateLevel, expForNextLevel, levelProgress } = require('../utils/experienceUtils');

// Get user profile with stats
const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Get basic user info
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get reading stats
    const readingStats = await ManhwaProgress.aggregate([
      { $match: { user: user._id } },
      { $group: {
        _id: null,
        totalManhwa: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$isCompleted', true] }, 1, 0] } },
        liked: { $sum: { $cond: [{ $eq: ['$isLiked', true] }, 1, 0] } },
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: { $cond: [{ $gt: [{ $strLenCP: '$review' }, 0] }, 1, 0] } }
      }}
    ]);
    
    // Get active level tasks
    const levelTasks = await LevelTask.findOne({ level: user.level });
    
    // Get task progress
    const taskProgress = {};
    
    if (levelTasks?.requirements) {
      for (const req of levelTasks.requirements) {
        if (req.type === 'read_manhwa') {
          const count = await ManhwaProgress.countDocuments({ 
            user: user._id, 
            isCompleted: true 
          });
          taskProgress.read_manhwa = { current: count, required: req.count };
        }
        
        else if (req.type === 'write_review') {
          const count = await ManhwaProgress.countDocuments({ 
            user: user._id, 
            review: { $exists: true, $ne: '' } 
          });
          taskProgress.write_review = { current: count, required: req.count };
        }
        
        else if (req.type === 'create_category') {
          const count = await Category.countDocuments({ user: user._id });
          taskProgress.create_category = { current: count, required: req.count };
        }
        
        else if (req.type === 'add_to_category') {
          // Count total manhwas added to categories
          const categories = await Category.find({ user: user._id });
          const count = categories.reduce((total, cat) => total + cat.manhwas.length, 0);
          taskProgress.add_to_category = { current: count, required: req.count };
        }
        
        else if (req.type === 'rate_manhwa') {
          const count = await ManhwaProgress.countDocuments({ 
            user: user._id, 
            rating: { $gt: 0 } 
          });
          taskProgress.rate_manhwa = { current: count, required: req.count };
        }
      }
    }
    
    // Get next level info
    const nextLevelExp = expForNextLevel(user.level);
    const progress = levelProgress(user.experience, user.level);
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        level: user.level,
        experience: user.experience,
        nextLevelExp,
        progress,
        language: user.language,
        darkMode: user.darkMode
      },
      stats: readingStats[0] || {
        totalManhwa: 0,
        completed: 0,
        liked: 0,
        averageRating: 0,
        totalReviews: 0
      },
      levelTask: levelTasks ? {
        description: levelTasks.description[user.language] || levelTasks.description.en,
        requirements: levelTasks.requirements,
        reward: levelTasks.reward,
        progress: taskProgress
      } : null
    });
  } catch (error) {
    next(error);
  }
};

// Get user reading history
const getUserReadingHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    
    // Base query
    const query = { user: req.user.id };
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    const total = await ManhwaProgress.countDocuments(query);
    const manhwas = await ManhwaProgress.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json({
      manhwas,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  getUserReadingHistory
};