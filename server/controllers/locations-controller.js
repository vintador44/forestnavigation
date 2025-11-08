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
}

module.exports = new LocationController();