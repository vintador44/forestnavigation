// src/controllers/PhotoController.js
const photoService = require('../service/photo-service');
const multer = require('multer');
const path = require('path');

// Настройка multer для обработки multipart/form-data
const storage = multer.memoryStorage(); // храним в памяти → потом в BLOB
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Только изображения: jpeg, jpg, png, webp'));
    }
  }
});

class PhotoController {
  // POST /api/photos/upload
  async uploadPhotos(req, res, next) {
    try {
      // Применяем middleware
      upload.array('photos', 5)(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ success: false, error: err.message });
        }

        const { locationId, userId } = req.body;
        const photos = req.files; // массив буферов

        if (!locationId || isNaN(locationId)) {
          return res.status(400).json({ success: false, error: 'locationId обязателен' });
        }
        if (!userId || isNaN(userId)) {
          return res.status(400).json({ success: false, error: 'userId обязателен' });
        }

        if (!photos || photos.length === 0) {
          return res.status(400).json({ success: false, error: 'Фотографии не загружены' });
        }

        const photoRecords = await photoService.createPhotos(
          parseInt(userId),
          parseInt(locationId),
          photos.map(file => ({
            buffer: file.buffer,
            mimetype: file.mimetype,
            originalname: file.originalname
          }))
        );

        return res.json({
          success: true,
          message: `Загружено ${photoRecords.length} фотографий`,
          photoIds: photoRecords.map(p => p.ID)
        });
      });
    } catch (e) {
      next(e);
    }
  }
  // GET /photos/location/:locationId
async getPhotosByLocation(req, res, next) {
  try {
    const { locationId } = req.params;

    if (!locationId || isNaN(locationId)) {
      return res.status(400).json({ success: false, error: 'Некорректный locationId' });
    }

    const photos = await photoService.getPhotosByLocation(parseInt(locationId, 10));

    // Преобразуем BLOB (Buffer) → Base64 для передачи в JSON (опционально — можно отдавать как бинарник, но Base64 удобнее для фронтенда)
    const photosWithBase64 = photos.map(p => ({
      ID: p.ID,
      UserID: p.UserID,
      LocationID: p.LocationID,
      mimetype: p.mimetype || 'image/jpeg', // вы можете хранить mimetype в БД, если нужно — сейчас его нет в модели
      base64: p.PhotoBYTEA.toString('base64')
    }));

    return res.json({
      success: true,
      count: photosWithBase64.length,
      photos: photosWithBase64
    });

  } catch (e) {
    next(e);
  }
}
}

module.exports = new PhotoController();