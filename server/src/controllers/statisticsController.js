const User = require('../models/User');
const ManhwaProgress = require('../models/ManhwaProgress');
const Comment = require('../models/Comment');
const Ban = require('../models/Ban');

// Отримати загальну статистику платформи
const getPlatformStatistics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalReaders = await User.countDocuments({ role: 'reader' });
    const totalTranslators = await User.countDocuments({ role: 'translator' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    
    const totalComments = await Comment.countDocuments();
    const newComments = await Comment.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    
    const readingStats = await ManhwaProgress.aggregate([
      {
        $group: {
          _id: null,
          totalProgress: { $sum: 1 },
          completedManhwas: { $sum: { $cond: [{ $eq: ['$isCompleted', true] }, 1, 0] } },
          totalRatings: { $sum: { $cond: [{ $gt: ['$rating', 0] }, 1, 0] } },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);
    
    const activeBans = await Ban.countDocuments({ isActive: true });
    
    res.json({
      usersStats: {
        total: totalUsers,
        readers: totalReaders,
        translators: totalTranslators,
        admins: totalAdmins,
        newLast30Days: newUsers
      },
      contentStats: {
        totalComments,
        newCommentsLast30Days: newComments
      },
      readingStats: readingStats[0] || {
        totalProgress: 0,
        completedManhwas: 0,
        totalRatings: 0,
        avgRating: 0
      },
      moderation: {
        activeBans
      }
    });
  } catch (error) {
    next(error);
  }
};

// Отримати топ читачів за кількістю прочитаних манг
const getTopReaders = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    const topReaders = await User.find()
      .sort({ totalManhwasRead: -1 }) 
      .limit(parseInt(limit))
      .select('username profilePic level totalManhwasRead');
    
    const result = topReaders.map(user => ({
      user: {
        id: user._id,
        username: user.username,
        profilePic: user.profilePic,
        level: user.level
      },
      completedCount: user.totalManhwasRead || 0
    }));
    
    res.json({ topReaders: result });
  } catch (error) {
    next(error);
  }
};

// Отримати користувачів з найвищим рівнем
const getTopLevelUsers = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    const topLevelUsers = await User.find()
      .select('username profilePic level experience')
      .sort({ level: -1, experience: -1 })
      .limit(parseInt(limit));
    
    res.json({ topLevelUsers });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlatformStatistics,
  getTopReaders,
  getTopLevelUsers
};