const locationsService = require('../service/locations-service');

class LocationController {
  async getLocations(req, res, next) {
    try {
      const { tags } = req.query;
      const tagList = tags ? tags.trim().split(/\s+/) : [];
      const locations = await locationsService.getLocations(tagList);
      return res.json(locations);
    } catch (e) {
      next(e);
    }
  }

 
  async updateLocation(req, res, next) {
    try {
      const { id } = req.params;
      const { LocationName, Coordinates, Description, Categories } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, error: 'ID обязателен' });
      }

     
      let geoCoords = undefined;
      if (Coordinates) {
        if (!Array.isArray(Coordinates) || Coordinates.length !== 2) {
          return res.status(400).json({
            success: false,
            error: 'Coordinates must be an array [longitude, latitude]'
          });
        }
        const [lng, lat] = Coordinates;
        if (typeof lng !== 'number' || typeof lat !== 'number') {
          return res.status(400).json({ success: false, error: 'Coordinates must be numbers' });
        }
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          return res.status(400).json({ success: false, error: 'Invalid coordinate range' });
        }
        geoCoords = { type: 'Point', coordinates: [lng, lat] };
      }

      const updateData = {};
      if (LocationName !== undefined) updateData.LocationName = LocationName.trim();
      if (Description !== undefined) updateData.Description = Description.trim();
      if (Categories !== undefined) updateData.Categories = Categories.trim();
      if (geoCoords) updateData.Coordinates = geoCoords;

      const updatedLocation = await locationsService.updateLocation(id, updateData);

      if (!updatedLocation) {
        return res.status(404).json({ success: false, error: 'Локация не найдена' });
      }

      return res.json({ success: true, location: updatedLocation });
    } catch (e) {
      next(e);
    }
  }

  async deleteLocation(req, res, next) {
    try {
      const { id } = req.params;
      if (!id || isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Invalid location ID' });
      }
      const result = await locationsService.deleteLocation(id);
      if (!result) {
        return res.status(404).json({ success: false, error: 'Location not found' });
      }
      return res.json({ success: true, message: 'Location deleted successfully' });
    } catch (e) {
      next(e);
    }
  }

  async getLocationById(req, res, next) {
    try {
      const { id } = req.params;
      if (!id || isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Invalid location ID' });
      }
      const location = await locationsService.getLocationById(id);
      if (!location) {
        return res.status(404).json({ success: false, error: 'Location not found' });
      }
      return res.json({ success: true, location });
    } catch (e) {
      next(e);
    }
  }

  async createLocation(req, res, next) {
    try {
      const { LocationName, Coordinates, Description, Categories } = req.body;
      if (!LocationName || !Coordinates || !Description) {
        return res.status(400).json({ success: false, error: 'LocationName, Coordinates and Description are required' });
      }
      if (!Array.isArray(Coordinates) || Coordinates.length !== 2) {
        return res.status(400).json({ success: false, error: 'Coordinates must be [lng, lat]' });
      }
      const [lng, lat] = Coordinates;
      if (typeof lng !== 'number' || typeof lat !== 'number' || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        return res.status(400).json({ success: false, error: 'Invalid coordinates' });
      }

      const newLocation = await locationsService.createLocation({
        LocationName: LocationName.trim(),
        Coordinates: { type: 'Point', coordinates: [lng, lat] },
        Description: Description.trim(),
        Categories: Categories ? Categories.trim() : null
      });

      return res.status(201).json({ success: true, location: newLocation });
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new LocationController();