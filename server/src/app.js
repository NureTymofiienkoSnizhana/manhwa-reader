const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const checkAndCreateDirectories = require('./utils/checkDirectories');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const manhwaRoutes = require('./routes/manhwaRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userManhwaRoutes = require('./routes/userManhwaRoutes.js');

// Load config
const config = require('./config/config');

// Initialize app
const app = express();

// Check and create required directories
checkAndCreateDirectories();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());
app.use(morgan('dev'));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', apiLimiter);

// Define routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/manhwa', manhwaRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user-manhwa', userManhwaRoutes);

app.use('/uploads', express.static('public/uploads'));
app.use('/public', express.static('public'));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling
app.use(errorHandler);

// Not found handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.get('/check-file', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) {
    return res.status(400).json({ error: 'No file path provided' });
  }
  
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    return res.json({ 
      exists: true, 
      path: fullPath,
      stats: fs.statSync(fullPath)
    });
  }
  
  return res.json({ 
    exists: false, 
    path: fullPath,
    searchedIn: process.cwd()
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;