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

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid location ID'
                });
            }

            const updateData = {};
            
            if (LocationName) updateData.LocationName = LocationName.trim();
            if (Description) updateData.Description = Description.trim();
            if (Categories !== undefined) updateData.Categories = Categories ? Categories.trim() : null;

            // Обработка координат если они предоставлены
            if (Coordinates) {
                if (!Array.isArray(Coordinates) || Coordinates.length !== 2) {
                    return res.status(400).json({
                        success: false,
                        error: 'Coordinates must be an array [longitude, latitude]'
                    });
                }

                const [longitude, latitude] = Coordinates;
                if (typeof longitude !== 'number' || typeof latitude !== 'number') {
                    return res.status(400).json({
                        success: false,
                        error: 'Longitude and latitude must be numbers'
                    });
                }

                if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid coordinates range'
                    });
                }

                updateData.Coordinates = { type: 'Point', coordinates: [longitude, latitude] };
            }

            const updatedLocation = await locationsService.updateLocation(id, updateData);

            if (!updatedLocation) {
                return res.status(404).json({
                    success: false,
                    error: 'Location not found'
                });
            }

            return res.json({
                success: true,
                location: updatedLocation,
                message: 'Location updated successfully'
            });

        } catch (e) {
            next(e);
        }
    }

    async deleteLocation(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid location ID'
                });
            }

            const result = await locationsService.deleteLocation(id);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    error: 'Location not found'
                });
            }

            return res.json({
                success: true,
                message: 'Location deleted successfully'
            });

        } catch (e) {
            next(e);
        }
    }

    async getLocationById(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid location ID'
                });
            }

            const location = await locationsService.getLocationById(id);

            if (!location) {
                return res.status(404).json({
                    success: false,
                    error: 'Location not found'
                });
            }

            return res.json({
                success: true,
                location: location
            });

        } catch (e) {
            next(e);
        }
    }
    async createLocation(req, res, next) {
        try {
            const { LocationName, Coordinates, Description, Categories } = req.body;
            
            // Валидация обязательных полей
            if (!LocationName || !Coordinates || !Description) {
                return res.status(400).json({
                    success: false,
                    error: 'LocationName, Coordinates and Description are required fields'
                });
            }

            // Валидация координат
            if (!Array.isArray(Coordinates) || Coordinates.length !== 2) {
                return res.status(400).json({
                    success: false,
                    error: 'Coordinates must be an array [longitude, latitude]'
                });
            }

            const [longitude, latitude] = Coordinates;
            if (typeof longitude !== 'number' || typeof latitude !== 'number') {
                return res.status(400).json({
                    success: false,
                    error: 'Longitude and latitude must be numbers'
                });
            }

            if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid coordinates range'
                });
            }

            const newLocation = await locationsService.createLocation({
                LocationName: LocationName.trim(),
                Coordinates: { type: 'Point', coordinates: [longitude, latitude] },
                Description: Description.trim(),
                Categories: Categories ? Categories.trim() : null
            });

            return res.status(201).json({
                success: true,
                location: newLocation,
                message: 'Location created successfully'
            });

        } catch (e) {
            next(e);
        }
    }

    // ... остальные методы (updateLocation, deleteLocation, getLocationById)
}

// Убедитесь, что экспорт правильный
module.exports = new LocationController();