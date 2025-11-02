
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
      autoIncrement: true
    },
    LocationName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    Coordinates: {
      type: DataTypes.STRING(255)
    },
    Description: {
      type: DataTypes.TEXT
    },
    Categories: {
      type: DataTypes.INTEGER,
      references: {
        model: 'categories',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Location',
    tableName: 'locations',
    timestamps: false
  });
  return Location;
};