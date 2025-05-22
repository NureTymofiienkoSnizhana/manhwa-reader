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

module.exports = mongoose.model('User', UserSchema);