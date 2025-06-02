const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const config = require('../config/config');

// Register a new user
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { username, email, password, language } = req.body;
    
    let user = await User.findOne({ $or: [{ email }, { username }] });
    
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    user = new User({
      username,
      email,
      password,
      language: language || 'en'
    });
    
    await user.save();
    
    const token = jwt.sign(
      { id: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiration }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        level: user.level,
        experience: user.experience,
        language: user.language,
        darkMode: user.darkMode
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).populate('bannedBy', 'username');
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    if (user.isBanned) {
      if (user.isBanExpired()) {
        user.unbanUser();
        await user.save();
      } else {
        const userBan = {
          reason: user.banReason,
          bannedBy: user.bannedBy,
          bannedUntil: user.banExpiresAt,
          banStatus: user.banStatus
        };
        
        return res.status(403).json({
          message: 'Your account has been banned',
          ban: userBan
        });
      }
    }
    
    const token = jwt.sign(
      { id: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiration }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        level: user.level,
        experience: user.experience,
        language: user.language,
        darkMode: user.darkMode
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('bannedBy', 'username');
    
    if (user.isBanned) {
      if (user.isBanExpired()) {
        user.unbanUser();
        await user.save();
      } else {
        const userBan = {
          reason: user.banReason,
          bannedBy: user.bannedBy,
          bannedUntil: user.banExpiresAt,
          banStatus: user.banStatus
        };
        
        return res.json({
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            level: user.level,
            experience: user.experience,
            language: user.language,
            darkMode: user.darkMode
          },
          userBan
        });
      }
    }
    
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        level: req.user.level,
        experience: req.user.experience,
        language: req.user.language,
        darkMode: req.user.darkMode
      }
    });
  } catch (error) {
    console.error('Error in getMe:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user preferences
const updatePreferences = async (req, res, next) => {
  try {
    const { language, darkMode } = req.body;
    
    const updateFields = {};
    if (language !== undefined) updateFields.language = language;
    if (darkMode !== undefined) updateFields.darkMode = darkMode;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true }
    );
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        level: user.level,
        experience: user.experience,
        language: user.language,
        darkMode: user.darkMode
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { username, email } = req.body;
    const userId = req.user.id;
    
    const existingUser = await User.findOne({
      $and: [
        { _id: { $ne: userId } },
        { $or: [{ email }, { username }] }
      ]
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        username: username.trim(),
        email: email.trim().toLowerCase()
      },
      { new: true }
    );
    
    res.json({
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        level: updatedUser.level,
        experience: updatedUser.experience,
        language: updatedUser.language,
        darkMode: updatedUser.darkMode
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Change password
const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updatePreferences,
  updateProfile,
  changePassword
};