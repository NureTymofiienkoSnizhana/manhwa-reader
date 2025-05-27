const fs = require('fs');
const path = require('path');

/**
 * Скрипт для перевірки та створення необхідних директорій для зберігання файлів
 */
const checkAndCreateDirectories = () => {
  const requiredDirectories = [
    'public/uploads',
    'public/uploads/covers',
    'public/uploads/pages'
  ];

  requiredDirectories.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      console.log(`Creating directory: ${fullPath}`);
      fs.mkdirSync(fullPath, { recursive: true });
    } else {
      console.log(`Directory exists: ${fullPath}`);
    }
  });

  console.log('All required directories have been checked and created if needed.');
};

// Експорт функції для використання в інших модулях
module.exports = checkAndCreateDirectories;