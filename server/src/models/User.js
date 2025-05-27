const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['reader', 'translator', 'admin'],
    default: 'reader'
  },
  level: {
    type: Number,
    default: 1
  },
  experience: {
    type: Number,
    default: 0
  },
  language: {
    type: String,
    enum: ['en', 'ua'],
    default: 'en'
  },
  darkMode: {
    type: Boolean,
    default: false
  },
  
  // Ban system fields
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    trim: true
  },
  bannedAt: {
    type: Date
  },
  bannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  banExpiresAt: {
    type: Date // null means permanent ban
  },
  
  // Profile fields
  profilePicture: {
    type: String // URL to profile picture
  },
  bio: {
    type: String,
    maxlength: 500
  },
  
  // Statistics
  totalManhwasRead: {
    type: Number,
    default: 0
  },
  totalChaptersRead: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  
  // Settings
  settings: {
    notifications: {
      newChapters: { type: Boolean, default: true },
      recommendations: { type: Boolean, default: true },
      systemMessages: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: false }
    },
    privacy: {
      profileVisibility: { 
        type: String, 
        enum: ['public', 'friends', 'private'], 
        default: 'public' 
      },
      showReadingActivity: { type: Boolean, default: true },
      showLibrary: { type: Boolean, default: true }
    },
    reading: {
      readingSpeed: { type: Number, default: 2, min: 1, max: 5 },
      autoBookmark: { type: Boolean, default: true },
      soundEffects: { type: Boolean, default: true }
    }
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Password hashing middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// Method to calculate experience needed for next level
UserSchema.methods.experienceForNextLevel = function() {
  return this.level * 100;
};

// Method to check if user can level up
UserSchema.methods.canLevelUp = function() {
  return this.experience >= this.experienceForNextLevel();
};

// Method to add experience and handle level up
UserSchema.methods.addExperience = function(amount) {
  this.experience += amount;
  
  while (this.canLevelUp()) {
    this.experience -= this.experienceForNextLevel();
    this.level += 1;
  }
};

// Method to ban user
UserSchema.methods.banUser = function(reason, bannedBy, expiresAt = null) {
  this.isBanned = true;
  this.banReason = reason;
  this.bannedAt = new Date();
  this.bannedBy = bannedBy;
  this.banExpiresAt = expiresAt;
};

// Method to unban user
UserSchema.methods.unbanUser = function() {
  this.isBanned = false;
  this.banReason = undefined;
  this.bannedAt = undefined;
  this.bannedBy = undefined;
  this.banExpiresAt = undefined;
};

// Method to check if ban is expired
UserSchema.methods.isBanExpired = function() {
  if (!this.isBanned) return false;
  if (!this.banExpiresAt) return false; // Permanent ban
  return new Date() > this.banExpiresAt;
};

// Virtual for ban status
UserSchema.virtual('banStatus').get(function() {
  if (!this.isBanned) return 'active';
  if (this.isBanExpired()) return 'expired';
  return this.banExpiresAt ? 'temporary' : 'permanent';
});

// Index for performance
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ isBanned: 1 });
UserSchema.index({ role: 1 });

module.exports = mongoose.model('User', UserSchema);