const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoURI: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  mangadexApiUrl: process.env.MANGADEX_API_URL,
  geminiApiKey: process.env.GEMINI_API_KEY,
  jwtExpiration: '24h'
};