'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Photo extends Model {
    static associate(models) {
      Photo.belongsTo(models.User, {
        foreignKey: 'UserID',
        as: 'user'
      });
      Photo.belongsTo(models.Location, {
        foreignKey: 'LocationID',
        as: 'location'
      });
    }
  }
  Photo.init({
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    UserID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'ID'
      }
    },
    LocationID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'locations',
        key: 'ID'
      }
    },
    PhotoBYTEA: {
      type: DataTypes.BLOB
    }
  }, {
    sequelize,
    modelName: 'Photo',
    tableName: 'photos',
    timestamps: false
  });
  return Photo;
};