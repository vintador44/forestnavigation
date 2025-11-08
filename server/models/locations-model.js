
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Location extends Model {
    static associate(models) {
      Location.belongsTo(models.Category, {
        foreignKey: 'Categories',
        as: 'category'
      });
    }
  }
  Location.init({
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    LocationName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    Coordinates: {
      type: DataTypes.GEOGRAPHY,
      allowNull: false
    },
    Description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    Categories: {
      type: DataTypes.STRING(150)
    }
  }, {
    sequelize,
    modelName: 'Location',
    tableName: 'locations',
    timestamps: false
  });
  return Location;
};