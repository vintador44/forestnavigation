const { Location } = require('../models');
//const { ApiError } = require("../exceptions/api-error");
const { LocationsDto } = require('../dtos/location-dto');

const { Op } = require('sequelize');

class LocationsService {
    async getLocations(tags) {
        const whereCond = {};
        if (tags && tags.length !== 0) {
            whereCond[Op.or] = [];
            tags.forEach((tag) => {
                const tagVars = [tag, `${tag} %`, `% ${tag} %`, `% ${tag}`];
                tagVars.forEach((tagVar) => {
                    whereCond[Op.or].push(
                        { Categories: { [Op.iLike]: tagVar } }
                    );
                });
            });
        }
        
        const locations = await Location.findAll({ where: whereCond });
        locations.forEach((loc) => {
            loc.Coordinates = loc.Coordinates.coordinates
        });
        return { locations: locations };
    } async createLocation(locationData) {
        const { Location } = require('../models'); // или через app.get если предпочитаете
        
        const newLocation = await Location.create(locationData);
        return newLocation;
    }

    async updateLocation(id, updateData) {
        
        
        const location = await Location.findByPk(id);
        if (!location) {
            return null;
        }

        await location.update(updateData);
        return location;
    }

    async deleteLocation(id) {
        
        
        const location = await Location.findByPk(id);
        if (!location) {
            return null;
        }

        await location.destroy();
        return true;
    }

    async getLocationById(id) {
       
        
        const location = await Location.findByPk(id);
        return location;
    }
}

module.exports = new LocationsService();