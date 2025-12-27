// src/service/photo-service.js
const db = require('../models');

// 1️⃣ Функция загрузки фото — уже есть у вас
const createPhotos = async (userId, locationId, photos) => {
  if (!Array.isArray(photos) || photos.length === 0) {
    return [];
  }

  const photoRecords = await Promise.all(
    photos.map(async (photo) => {
      const photoRecord = await db.Photo.create({
        UserID: userId,
        LocationID: locationId,
        PhotoBYTEA: photo.buffer
        // ⚠️ Важно: если хотите mimetype — добавьте колонку и сохраняйте его!
      });
      return photoRecord;
    })
  );

  return photoRecords;
};

// 2️⃣ НОВАЯ функция — ОБЪЯВИТЬ ДО module.exports!
const getPhotosByLocation = async (locationId) => {
  return await db.Photo.findAll({
    where: { LocationID: locationId },
    attributes: ['ID', 'UserID', 'LocationID', 'PhotoBYTEA']
  });
};

// 3️⃣ Экспорт — только здесь ссылаемся на переменные
module.exports = {
  createPhotos,
  getPhotosByLocation
};