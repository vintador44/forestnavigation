'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Dots extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Dots.init({
    ID: DataTypes.INTEGER,
    ThisDotCoordinates: DataTypes.GEOGRAPHY,
    NextDotCoordinates: DataTypes.GEOGRAPHY,
    RoadID: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'dots',
  });
  return Dots;
};