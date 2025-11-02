'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Road extends Model {
    static associate(models) {
      Road.belongsTo(models.User, {
        foreignKey: 'UserID',
        as: 'user'
      });
      Road.hasMany(models.Dot, {
        foreignKey: 'RoadID',
        as: 'dots'
      });
      Road.hasMany(models.Vote, {
        foreignKey: 'RoadID',
        as: 'votes'
      });
    }
  }
  Road.init({
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Description: {
      type: DataTypes.TEXT
    },
    UserID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'ID'
      }
    },
    StartDateTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    EndDateTime: {
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'Road',
    tableName: 'roads',
    timestamps: false
  });
  return Road;
};