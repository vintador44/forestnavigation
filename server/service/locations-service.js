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
    }
}

module.exports = new LocationsService();