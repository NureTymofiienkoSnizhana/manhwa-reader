const User = require('../models/User');
const LevelTask = require('../models/LevelTask');

// Get all users (admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    
    const query = {};
    if (role) {
      query.role = role;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(query)
      .select('username email role level experience profilePic createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Search users by username or email (admin only)
const searchUsers = async (req, res, next) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 3) {
      return res.status(400).json({ message: 'Search query must be at least 3 characters' });
    }
    
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('username email role level experience profilePic createdAt')
    .limit(20);
    
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

// Delete user (admin only)
const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete administrator account' });
    }
    
    await User.findByIdAndDelete(userId);
    
    await ManhwaProgress.deleteMany({ user: userId });
    await Comment.deleteMany({ user: userId });
    await Category.deleteMany({ user: userId });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Update user role (admin only)
const updateUserRole = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { userId, role } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role === 'admin' && role !== 'admin' && user.id !== req.user.id) {
      return res.status(403).json({ message: 'Cannot change role of another administrator' });
    }
    
    user.role = role;
    await user.save();
    
    res.json({ 
      message: 'User role updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
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
    
    let task = await LevelTask.findOne({ level: parseInt(level) });
    
    if (task) {
      task.description = description;
      task.requirements = requirements;
      task.reward = reward;
    } else {
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
  deleteLevelTask,
  updateUserRole,
  searchUsers,
  deleteUser
};