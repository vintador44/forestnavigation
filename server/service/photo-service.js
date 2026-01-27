
const db = require('../models');


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
     
      });
      return photoRecord;
    })
  );

  return photoRecords;
};


const getPhotosByLocation = async (locationId) => {
  return await db.Photo.findAll({
    where: { LocationID: locationId },
    attributes: ['ID', 'UserID', 'LocationID', 'PhotoBYTEA']
  });
};


module.exports = {
  createPhotos,
  getPhotosByLocation
};