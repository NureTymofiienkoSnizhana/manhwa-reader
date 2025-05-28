const Ban = require('../models/Ban');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Отримати всі активні бани
const getActiveBans = async (req, res, next) => {
  try {
    const bans = await Ban.find({ isActive: true })
      .populate('user', 'username email role')
      .populate('bannedBy', 'username')
      .sort({ createdAt: -1 });
    
    res.json({ bans });
  } catch (error) {
    next(error);
  }
};

// Отримати історію банів
const getBanHistory = async (req, res, next) => {
  try {
    const bans = await Ban.find()
      .populate('user', 'username email role')
      .populate('bannedBy', 'username')
      .sort({ createdAt: -1 });
    
    res.json({ bans });
  } catch (error) {
    next(error);
  }
};

// Заблокувати користувача
const banUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { userId, reason, banDuration } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot ban an administrator' });
    }
    
    const now = new Date();
    let bannedUntil = new Date();
    
    switch(banDuration) {
      case '1d': bannedUntil.setDate(now.getDate() + 1); break;
      case '3d': bannedUntil.setDate(now.getDate() + 3); break;
      case '7d': bannedUntil.setDate(now.getDate() + 7); break;
      case '30d': bannedUntil.setDate(now.getDate() + 30); break;
      case 'permanent': bannedUntil.setFullYear(now.getFullYear() + 100); break;
      default: bannedUntil.setDate(now.getDate() + 1);
    }
    
    await Ban.updateMany(
      { user: userId, isActive: true },
      { isActive: false }
    );
    
    const ban = new Ban({
      user: userId,
      reason,
      bannedBy: req.user.id,
      bannedUntil,
      isActive: true
    });
    
    await ban.save();
    
    user.banUser(reason, req.user.id, banDuration === 'permanent' ? null : bannedUntil);
    await user.save();
    
    res.status(201).json({ message: 'User banned successfully', ban });
  } catch (error) {
    next(error);
  }
};

// Розблокувати користувача
const unbanUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const result = await Ban.updateMany(
      { user: userId, isActive: true },
      { isActive: false }
    );
    
    user.unbanUser();
    await user.save();
    
    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActiveBans,
  getBanHistory,
  banUser,
  unbanUser
};