// server/src/controllers/userChapterController.js
const { validationResult } = require('express-validator');
const UserChapter = require('../models/UserChapter');
const UserManhwa = require('../models/UserManhwa');
const User = require('../models/User');

// Отримання контенту глави користувацької манхви
const getUserChapterContent = async (req, res, next) => {
  try {
    const { manhwaId, chapterId } = req.params;
    
    // Знаходимо главу за ID
    const chapter = await UserChapter.findById(chapterId)
      .populate('manhwa', 'title creator')
      .populate('creator', 'username');
    
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    
    // Перевіряємо, що глава належить правильній манхві
    if (chapter.manhwa._id.toString() !== manhwaId) {
      return res.status(404).json({ message: 'Chapter not found in this manhwa' });
    }
    
    // Перевіряємо, чи опублікована глава
    if (!chapter.isPublished) {
      // Дозволяємо переглядати неопубліковані глави тільки їх авторам та адмінам
      if (!req.user || (chapter.creator._id.toString() !== req.user.id && req.user.role !== 'admin')) {
        return res.status(403).json({ message: 'This chapter is not published yet' });
      }
    }
    
    // Збільшуємо лічильник переглядів (якщо глава опублікована)
    if (chapter.isPublished) {
      chapter.viewCount += 1;
      await chapter.save();
    }
    
    // Повертаємо дані глави
    res.json({
      chapter: {
        id: chapter._id,
        title: chapter.title,
        chapterNumber: chapter.chapterNumber,
        pages: chapter.pages,
        creator: chapter.creator.username,
        publishedAt: chapter.publishedAt,
        viewCount: chapter.viewCount,
        language: chapter.language
      },
      manhwa: {
        id: chapter.manhwa._id,
        title: chapter.manhwa.title
      }
    });
  } catch (error) {
    next(error);
  }
};

// Отримання списку глав для манхви
const getUserManhwaChapters = async (req, res, next) => {
  try {
    const { manhwaId } = req.params;
    const { lang = 'en', limit = 100, offset = 0 } = req.query;
    
    // Перевіряємо, чи існує манхва
    const manhwa = await UserManhwa.findById(manhwaId);
    
    if (!manhwa) {
      return res.status(404).json({ message: 'Manhwa not found' });
    }
    
    // Створюємо запит для пошуку глав
    const query = { 
      manhwa: manhwaId,
      isPublished: true // Показуємо тільки опубліковані глави для звичайних користувачів
    };
    
    // Якщо користувач є автором або адміном, показуємо всі глави
    if (req.user && (manhwa.creator.toString() === req.user.id || req.user.role === 'admin')) {
      delete query.isPublished;
    }
    
    // Додаємо фільтр мови, якщо вказано
    if (lang && lang !== 'all') {
      query.language = lang;
    }
    
    const total = await UserChapter.countDocuments(query);
    const chapters = await UserChapter.find(query)
      .sort({ chapterNumber: 1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .select('title chapterNumber publishedAt viewCount language isPublished');
    
    res.json({
      total,
      chapters: chapters.map(chapter => ({
        id: chapter._id,
        chapter: chapter.chapterNumber.toString(),
        title: chapter.title,
        publishedAt: chapter.publishedAt,
        viewCount: chapter.viewCount,
        language: chapter.language,
        isPublished: chapter.isPublished
      }))
    });
  } catch (error) {
    next(error);
  }
};

// Видалення глави (тільки для авторів та адмінів)
const deleteUserChapter = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    
    // Знаходимо главу
    const chapter = await UserChapter.findById(chapterId)
      .populate('manhwa', 'creator');
    
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    
    // Перевіряємо права доступу
    if (chapter.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Видаляємо файли сторінок
    const fs = require('fs');
    const path = require('path');
    
    for (const page of chapter.pages) {
      const pagePath = path.join('public', page);
      if (fs.existsSync(pagePath)) {
        fs.unlinkSync(pagePath);
      }
    }
    
    // Видаляємо главу з бази даних
    await UserChapter.findByIdAndDelete(chapterId);
    
    // Оновлюємо статистику манхви
    const manhwa = await UserManhwa.findById(chapter.manhwa._id);
    await manhwa.updateChapterCount();
    
    res.json({ message: 'Chapter deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Оновлення глави (тільки для авторів та адмінів)
const updateUserChapter = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { chapterId } = req.params;
    const { title } = req.body;
    
    // Знаходимо главу
    const chapter = await UserChapter.findById(chapterId);
    
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    
    // Перевіряємо права доступу
    if (chapter.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Оновлюємо назву глави
    if (title !== undefined) {
      chapter.title = title;
    }
    
    await chapter.save();
    
    res.json({ 
      chapter,
      message: 'Chapter updated successfully' 
    });
  } catch (error) {
    next(error);
  }
};

// Зміна порядку глави (переміщення вгору/вниз)
const reorderUserChapter = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const { direction } = req.body; // 'up' або 'down'
    
    // Знаходимо главу
    const chapter = await UserChapter.findById(chapterId);
    
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    
    // Перевіряємо права доступу
    if (chapter.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Знаходимо всі глави цієї манхви, відсортовані за номером
    const allChapters = await UserChapter.find({ manhwa: chapter.manhwa })
      .sort({ chapterNumber: 1 });
    
    const currentIndex = allChapters.findIndex(ch => ch._id.toString() === chapterId);
    
    if (currentIndex === -1) {
      return res.status(404).json({ message: 'Chapter not found in manhwa' });
    }
    
    let targetIndex;
    if (direction === 'up') {
      targetIndex = currentIndex - 1;
    } else if (direction === 'down') {
      targetIndex = currentIndex + 1;
    } else {
      return res.status(400).json({ message: 'Invalid direction. Use "up" or "down"' });
    }
    
    // Перевіряємо, чи можна виконати переміщення
    if (targetIndex < 0 || targetIndex >= allChapters.length) {
      return res.status(400).json({ message: 'Cannot move chapter in this direction' });
    }
    
    // Міняємо місцями номери глав
    const currentChapter = allChapters[currentIndex];
    const targetChapter = allChapters[targetIndex];
    
    const tempChapterNumber = currentChapter.chapterNumber;
    currentChapter.chapterNumber = targetChapter.chapterNumber;
    targetChapter.chapterNumber = tempChapterNumber;
    
    // Зберігаємо зміни
    await currentChapter.save();
    await targetChapter.save();
    
    res.json({ 
      message: 'Chapter order updated successfully',
      movedChapter: {
        id: currentChapter._id,
        newChapterNumber: currentChapter.chapterNumber
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserChapterContent,
  getUserManhwaChapters,
  deleteUserChapter,
  updateUserChapter,
  reorderUserChapter
};