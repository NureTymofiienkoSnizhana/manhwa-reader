const mongoose = require('mongoose');

const ManhwaProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  manhwaId: {
    type: String, // MangaDex ID
    required: true
  },
  title: {
    type: String,
    required: true
  },
  coverImage: String,
  lastChapterRead: {
    type: Number,
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  review: String,
  categories: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['reading', 'completed', 'plan_to_read', 'dropped'],
    default: 'reading'
  },
  isLiked: {
    type: Boolean,
    default: false
  },
  experienceGained: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index to ensure a user can only have one progress entry per manhwa
ManhwaProgressSchema.index({ user: 1, manhwaId: 1 }, { unique: true });

module.exports = mongoose.model('ManhwaProgress', ManhwaProgressSchema);