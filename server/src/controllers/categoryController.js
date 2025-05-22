const { validationResult } = require('express-validator');
const Category = require('../models/Category');
const User = require('../models/User');
const { getMangaById } = require('../utils/mangadexUtils');
const { EXP_REWARDS } = require('../utils/experienceUtils');

// Get user categories
const getUserCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ user: req.user.id });
    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

// Create new category
const createCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, description } = req.body;
    
    // Check if category already exists
    const existingCategory = await Category.findOne({
      user: req.user.id,
      name
    });
    
    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }
    
    // Create new category
    const category = new Category({
      user: req.user.id,
      name,
      description,
      manhwas: []
    });
    
    await category.save();
    
    // Award experience for creating category
    const user = await User.findById(req.user.id);
    user.addExperience(EXP_REWARDS.CREATE_CATEGORY);
    await user.save();
    
    res.status(201).json({
      category,
      expGained: EXP_REWARDS.CREATE_CATEGORY,
      message: 'Category created! +10 EXP'
    });
  } catch (error) {
    next(error);
  }
};

// Update category
const updateCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { categoryId } = req.params;
    const { name, description } = req.body;
    
    // Find and update category
    const category = await Category.findOne({
      _id: categoryId,
      user: req.user.id
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if new name already exists in another category
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        user: req.user.id,
        name,
        _id: { $ne: categoryId }
      });
      
      if (existingCategory) {
        return res.status(400).json({ message: 'Category with this name already exists' });
      }
      
      category.name = name;
    }
    
    if (description !== undefined) {
      category.description = description;
    }
    
    await category.save();
    
    res.json({ category });
  } catch (error) {
    next(error);
  }
};

// Delete category
const deleteCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    
    // Find and delete category
    const category = await Category.findOneAndDelete({
      _id: categoryId,
      user: req.user.id
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Add manhwa to category
const addManhwaToCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { manhwaId } = req.body;
    
    // Find category
    const category = await Category.findOne({
      _id: categoryId,
      user: req.user.id
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if manhwa already in category
    const isAlreadyInCategory = category.manhwas.some(m => m.manhwaId === manhwaId);
    
    if (isAlreadyInCategory) {
      return res.status(400).json({ message: 'Manhwa already in category' });
    }
    
    // Get manga details to ensure it exists and get title
    const manga = await getMangaById(manhwaId);
    
    // Add manhwa to category
    category.manhwas.push({
      manhwaId,
      title: manga.title,
      coverImage: manga.coverImage
    });
    
    await category.save();
    
    // Award experience for adding to category
    const user = await User.findById(req.user.id);
    user.addExperience(EXP_REWARDS.ADD_TO_CATEGORY);
    await user.save();
    
    res.json({
      category,
      expGained: EXP_REWARDS.ADD_TO_CATEGORY,
      message: 'Manhwa added to category! +2 EXP'
    });
  } catch (error) {
    next(error);
  }
};

// Remove manhwa from category
const removeManhwaFromCategory = async (req, res, next) => {
  try {
    const { categoryId, manhwaId } = req.params;
    
    // Find category
    const category = await Category.findOne({
      _id: categoryId,
      user: req.user.id
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if manhwa is in category
    const manhwaIndex = category.manhwas.findIndex(m => m.manhwaId === manhwaId);
    
    if (manhwaIndex === -1) {
      return res.status(400).json({ message: 'Manhwa not in category' });
    }
    
    // Remove manhwa from category
    category.manhwas.splice(manhwaIndex, 1);
    await category.save();
    
    res.json({
      category,
      message: 'Manhwa removed from category'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  addManhwaToCategory,
  removeManhwaFromCategory
};