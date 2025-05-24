// src/models/UserChapter.js
const mongoose = require('mongoose');

const UserChapterSchema = new mongoose.Schema({
  manhwa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserManhwa',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  chapterNumber: {
    type: Number,
    required: true
  },
  pages: [{
    type: String, // Шляхи до файлів сторінок
    required: true
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  language: {
    type: String,
    enum: ['en', 'ua', 'ko', 'ja', 'zh'],
    default: 'en'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  
  // Статистика
  viewCount: {
    type: Number,
    default: 0
  },
  
  // Звіти та скарги
  reports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['inappropriate', 'copyright', 'spam', 'offensive', 'other']
    },
    description: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Індекси для оптимізації пошуку
UserChapterSchema.index({ manhwa: 1, chapterNumber: 1 }, { unique: true });
UserChapterSchema.index({ creator: 1 });
UserChapterSchema.index({ isPublished: 1 });

module.exports = mongoose.model('UserChapter', UserChapterSchema);