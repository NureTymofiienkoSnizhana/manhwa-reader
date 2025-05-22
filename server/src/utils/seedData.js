const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const LevelTask = require('../models/LevelTask');
const config = require('../config/config');
const levelTaskSeeds = require('./seeds/levelTaskSeeds');

// Connect to database
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Seed level tasks
const seedLevelTasks = async () => {
  try {
    // Clear existing level tasks
    await LevelTask.deleteMany({});
    
    // Insert new level tasks
    await LevelTask.insertMany(levelTaskSeeds);
    
    console.log('Level tasks seeded successfully');
  } catch (error) {
    console.error('Error seeding level tasks:', error.message);
  }
};

// Seed admin user
const seedAdminUser = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    
    if (adminExists) {
      console.log('Admin user already exists, skipping');
      return;
    }
    
    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const admin = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      level: 10,
      experience: 5000
    });
    
    await admin.save();
    
    console.log('Admin user seeded successfully');
  } catch (error) {
    console.error('Error seeding admin user:', error.message);
  }
};

// Run seeds
const seedAll = async () => {
  try {
    await seedLevelTasks();
    await seedAdminUser();
    
    console.log('All seeds completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running seeds:', error.message);
    process.exit(1);
  }
};

seedAll();