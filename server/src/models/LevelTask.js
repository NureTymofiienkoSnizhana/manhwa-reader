const mongoose = require('mongoose');

const LevelTaskSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: true,
    unique: true
  },
  description: {
    type: {
      en: String,
      ua: String
    },
    required: true
  },
  requirements: [{
    type: {
      type: String,
      enum: ['read_manhwa', 'write_review', 'create_category', 'add_to_category', 'rate_manhwa'],
      required: true
    },
    count: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  reward: {
    type: Number, // Experience points
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LevelTask', LevelTaskSchema);