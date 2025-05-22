const User = require('../models/User');
const LevelTask = require('../models/LevelTask');

// Get all users (admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    
    // Create search query
    const searchQuery = search ? {
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};
    
    const total = await User.countDocuments(searchQuery);
    const users = await User.find(searchQuery)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json({
      users,
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

// Get level tasks
const getLevelTasks = async (req, res, next) => {
  try {
    const tasks = await LevelTask.find().sort({ level: 1 });
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
};

// Create or update level task
const updateLevelTask = async (req, res, next) => {
  try {
    const { level } = req.params;
    const { description, requirements, reward } = req.body;
    
    // Find existing task or create new
    let task = await LevelTask.findOne({ level: parseInt(level) });
    
    if (task) {
      // Update existing task
      task.description = description;
      task.requirements = requirements;
      task.reward = reward;
    } else {
      // Create new task
      task = new LevelTask({
        level: parseInt(level),
        description,
        requirements,
        reward
      });
    }
    
    await task.save();
    
    res.json({ task });
  } catch (error) {
    next(error);
  }
};

// Delete level task
const deleteLevelTask = async (req, res, next) => {
  try {
    const { level } = req.params;
    
    const task = await LevelTask.findOneAndDelete({ level: parseInt(level) });
    
    if (!task) {
      return res.status(404).json({ message: 'Level task not found' });
    }
    
    res.json({ message: 'Level task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getLevelTasks,
  updateLevelTask,
  deleteLevelTask
};