// src/controllers/userManhwaController.js
const { validationResult } = require('express-validator');
const UserManhwa = require('../models/UserManhwa');
const UserChapter = require('../models/UserChapter');
const User = require('../models/User');
const { EXP_REWARDS } = require('../utils/experienceUtils');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');

// Конфігурація для зберігання файлів
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = file.fieldname === 'cover' 
      ? 'public/uploads/covers' 
      : 'public/uploads/pages';
    
    // Створення директорії, якщо вона не існує
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Фільтр для перевірки типу файлу
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Непідтримуваний формат файлу. Будь ласка, завантажте зображення формату JPEG, PNG або WebP.'), false);
  }
};

// Створення об'єкту multer для завантаження файлів
const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Middleware для завантаження обкладинки
const uploadCover = upload.single('cover');

// Middleware для завантаження сторінок глави
const uploadPages = upload.array('pages', 100); // Максимум 100 сторінок

// Створення нової манхви
const createUserManhwa = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { 
      title, 
      description, 
      author, 
      genres, 
      tags, 
      status, 
      language 
    } = req.body;
    
    // Перевірка, чи завантажено обкладинку
    if (!req.file) {
      return res.status(400).json({ message: 'Обкладинка обов\'язкова' });
    }
    
    // Обробка обкладинки - стиснення та зміна розміру
    const coverPath = req.file.path;
    const optimizedCoverPath = `${path.dirname(coverPath)}/opt_${path.basename(coverPath)}`;
    
    await sharp(coverPath)
      .resize(400, 600, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(optimizedCoverPath);
    
    // Видалення оригінального файлу
    fs.unlinkSync(coverPath);
    
    // Створення slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now();
    
    // Створення нової манхви
    const userManhwa = new UserManhwa({
      title,
      description,
      coverImage: optimizedCoverPath.replace('public/', '/'),
      creator: req.user.id,
      author: author || req.user.username,
      genres: genres ? JSON.parse(genres) : [],
      tags: tags ? JSON.parse(tags) : [],
      status: status || 'ongoing',
      language: language || 'en',
      slug,
      searchKeywords: [
        title, 
        author || req.user.username, 
        ...(tags ? JSON.parse(tags) : [])
      ]
    });
    
    await userManhwa.save();
    
    // Нагорода досвіду за створення манхви
    const user = await User.findById(req.user.id);
    user.addExperience(EXP_REWARDS.CREATE_MANHWA || 50);
    await user.save();
    
    res.status(201).json({
      manhwa: userManhwa,
      expGained: EXP_REWARDS.CREATE_MANHWA || 50,
      message: 'Манхву успішно створено! +50 XP'
    });
  } catch (error) {
    next(error);
  }
};

// Додавання нової глави
const addChapter = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { manhwaId } = req.params;
    const { title, chapterNumber } = req.body;
    
    // Перевірка, чи існує манхва
    const manhwa = await UserManhwa.findById(manhwaId);
    
    if (!manhwa) {
      return res.status(404).json({ message: 'Манхву не знайдено' });
    }
    
    // Перевірка прав доступу
    if (manhwa.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Немає прав для редагування цієї манхви' });
    }
    
    // Перевірка, чи завантажено сторінки
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Необхідно завантажити хоча б одну сторінку' });
    }
    
    // Обробка завантажених сторінок
    const pagesPaths = [];
    for (const file of req.files) {
      const filePath = file.path;
      const optimizedPath = `${path.dirname(filePath)}/opt_${path.basename(filePath)}`;
      
      await sharp(filePath)
        .resize(1200, null, { fit: 'inside' })
        .jpeg({ quality: 85 })
        .toFile(optimizedPath);
      
      // Видалення оригінального файлу
      fs.unlinkSync(filePath);
      
      pagesPaths.push(optimizedPath.replace('public/', '/'));
    }
    
    // Створення нової глави
    const chapter = new UserChapter({
      manhwa: manhwaId,
      title: title || `Глава ${chapterNumber}`,
      chapterNumber: parseFloat(chapterNumber),
      pages: pagesPaths,
      creator: req.user.id,
      language: manhwa.language,
      isPublished: true,
      publishedAt: new Date()
    });
    
    await chapter.save();
    
    // Оновлення інформації про манхву
    manhwa.totalChapters += 1;
    manhwa.lastChapterNumber = Math.max(manhwa.lastChapterNumber, parseFloat(chapterNumber));
    manhwa.lastUpdateDate = new Date();
    await manhwa.save();
    
    // Нагорода досвіду за додавання глави
    const user = await User.findById(req.user.id);
    user.addExperience(EXP_REWARDS.ADD_CHAPTER || 20);
    await user.save();
    
    res.status(201).json({
      chapter,
      expGained: EXP_REWARDS.ADD_CHAPTER || 20,
      message: 'Главу успішно додано! +20 XP'
    });
  } catch (error) {
    next(error);
  }
};

// Отримання списку манхв користувача
const getUserManhwas = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const manhwas = await UserManhwa.find({ creator: req.user.id })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await UserManhwa.countDocuments({ creator: req.user.id });
    
    res.json({
      manhwas,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Отримання деталей манхви
const getUserManhwaDetails = async (req, res, next) => {
  try {
    const { manhwaId } = req.params;
    
    const manhwa = await UserManhwa.findById(manhwaId);
    
    if (!manhwa) {
      return res.status(404).json({ message: 'Manhwa not found' });
    }
    
    // Отримання глав
    const chapters = await UserChapter.find({ manhwa: manhwaId })
      .sort({ chapterNumber: 1 });
    
    res.json({
      manhwa,
      chapters
    });
  } catch (error) {
    next(error);
  }
};

// Редагування манхви
const updateUserManhwa = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { manhwaId } = req.params;
    const { 
      title, 
      description, 
      author, 
      genres, 
      tags, 
      status 
    } = req.body;
    
    // Перевірка, чи існує манхва
    const manhwa = await UserManhwa.findById(manhwaId);
    
    if (!manhwa) {
      return res.status(404).json({ message: 'Манхву не знайдено' });
    }
    
    // Перевірка прав доступу
    if (manhwa.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Немає прав для редагування цієї манхви' });
    }
    
    // Оновлення полів
    if (title) manhwa.title = title;
    if (description) manhwa.description = description;
    if (author) manhwa.author = author;
    if (genres) manhwa.genres = JSON.parse(genres);
    if (tags) manhwa.tags = JSON.parse(tags);
    if (status) manhwa.status = status;
    
    // Оновлення обкладинки, якщо вона завантажена
    if (req.file) {
      // Видалення старої обкладинки
      const oldCoverPath = path.join('public', manhwa.coverImage);
      if (fs.existsSync(oldCoverPath)) {
        fs.unlinkSync(oldCoverPath);
      }
      
      // Обробка нової обкладинки
      const coverPath = req.file.path;
      const optimizedCoverPath = `${path.dirname(coverPath)}/opt_${path.basename(coverPath)}`;
      
      await sharp(coverPath)
        .resize(400, 600, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(optimizedCoverPath);
      
      // Видалення оригінального файлу
      fs.unlinkSync(coverPath);
      
      manhwa.coverImage = optimizedCoverPath.replace('public/', '/');
    }
    
    // Оновлення ключових слів для пошуку
    manhwa.searchKeywords = [
      manhwa.title, 
      manhwa.author, 
      ...manhwa.tags
    ];
    
    await manhwa.save();
    
    res.json({
      manhwa,
      message: 'Манхву успішно оновлено!'
    });
  } catch (error) {
    next(error);
  }
};

// Видалення манхви
const deleteUserManhwa = async (req, res, next) => {
  try {
    const { manhwaId } = req.params;
    
    // Перевірка, чи існує манхва
    const manhwa = await UserManhwa.findById(manhwaId);
    
    if (!manhwa) {
      return res.status(404).json({ message: 'Манхву не знайдено' });
    }
    
    // Перевірка прав доступу
    if (manhwa.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Немає прав для видалення цієї манхви' });
    }
    
    // Видалення обкладинки
    const coverPath = path.join('public', manhwa.coverImage);
    if (fs.existsSync(coverPath)) {
      fs.unlinkSync(coverPath);
    }
    
    // Отримання та видалення всіх глав та їх сторінок
    const chapters = await UserChapter.find({ manhwa: manhwaId });
    
    for (const chapter of chapters) {
      // Видалення всіх сторінок
      for (const page of chapter.pages) {
        const pagePath = path.join('public', page);
        if (fs.existsSync(pagePath)) {
          fs.unlinkSync(pagePath);
        }
      }
      
      // Видалення глави
      await UserChapter.findByIdAndDelete(chapter._id);
    }
    
    // Видалення манхви
    await UserManhwa.findByIdAndDelete(manhwaId);
    
    res.json({ message: 'Манхву та всі її глави успішно видалено' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUserManhwa,
  uploadCover,
  addChapter,
  uploadPages,
  getUserManhwas,
  getUserManhwaDetails,
  updateUserManhwa,
  deleteUserManhwa
};