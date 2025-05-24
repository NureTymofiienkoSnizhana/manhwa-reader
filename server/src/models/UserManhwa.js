const mongoose = require('mongoose');

const UserManhwaSchema = new mongoose.Schema({
  // Основна інформація
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  coverImage: {
    type: String,
    required: true
  },
  
  // Автор/створювач
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  
  // Категорії та жанри
  genres: [{
    type: String,
    enum: [
      'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 
      'Horror', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 
      'Supernatural', 'Thriller', 'Mystery', 'School', 
      'Historical', 'Military', 'Mecha', 'Psychological'
    ]
  }],
  tags: [String],
  
  // Статус
  status: {
    type: String,
    enum: ['ongoing', 'completed', 'hiatus', 'cancelled'],
    default: 'ongoing'
  },
  
  // Контент
  language: {
    type: String,
    enum: ['en', 'ua', 'ko', 'ja', 'zh'],
    default: 'en'
  },
  
  // Рейтинг та статистика
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  followCount: {
    type: Number,
    default: 0
  },
  
  // Модерація
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  
  // Звіти та скарги
  reportCount: {
    type: Number,
    default: 0
  },
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
  }],
  
  // Метадані
  totalChapters: {
    type: Number,
    default: 0
  },
  lastChapterNumber: {
    type: Number,
    default: 0
  },
  lastUpdateDate: Date,
  
  // SEO та пошук
  slug: {
    type: String,
    unique: true,
    required: true
  },
  searchKeywords: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Віртуальне поле для глав
UserManhwaSchema.virtual('chapters', {
  ref: 'UserChapter',
  localField: '_id',
  foreignField: 'manhwa'
});

// Індекси для оптимізації пошуку
UserManhwaSchema.index({ title: 'text', description: 'text', tags: 'text' });
UserManhwaSchema.index({ creator: 1, createdAt: -1 });
UserManhwaSchema.index({ isApproved: 1, isPublished: 1 });
UserManhwaSchema.index({ genres: 1, status: 1 });
UserManhwaSchema.index({ rating: -1, followCount: -1 });
UserManhwaSchema.index({ slug: 1 }, { unique: true });

// Middleware для створення slug
UserManhwaSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now();
  }
  next();
});

// Методи для оновлення статистики
UserManhwaSchema.methods.updateRating = async function(newRating, isUpdate = false) {
  if (isUpdate) {
    // Для оновлення рейтингу потрібно перерахувати середнє значення
    const ratings = await mongoose.model('ManhwaProgress').find({
      manhwaId: this._id.toString(),
      rating: { $gt: 0 }
    }).select('rating');
    
    this.ratingCount = ratings.length;
    this.rating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
      : 0;
  } else {
    // Для нового рейтингу
    const totalRating = (this.rating * this.ratingCount) + newRating;
    this.ratingCount += 1;
    this.rating = totalRating / this.ratingCount;
  }
  
  await this.save();
};

UserManhwaSchema.methods.incrementView = async function() {
  this.viewCount += 1;
  await this.save();
};

UserManhwaSchema.methods.updateChapterCount = async function() {
  const chapterCount = await mongoose.model('UserChapter').countDocuments({
    manhwa: this._id,
    isPublished: true
  });
  
  const lastChapter = await mongoose.model('UserChapter')
    .findOne({ manhwa: this._id, isPublished: true })
    .sort({ chapterNumber: -1 });
  
  this.totalChapters = chapterCount;
  this.lastChapterNumber = lastChapter ? lastChapter.chapterNumber : 0;
  this.lastUpdateDate = lastChapter ? lastChapter.publishedAt : this.updatedAt;
  
  await this.save();
};

module.exports = mongoose.model('UserManhwa', UserManhwaSchema);