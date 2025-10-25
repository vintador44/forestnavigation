'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Locations extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Locations.init({
    ID: DataTypes.INTEGER,
    LocationName: DataTypes.STRING,
    Coordinates: DataTypes.GEOGRAPHY,
    Description: DataTypes.STRING,
    Categories: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'locations',
  });
  return Locations;
};