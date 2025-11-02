'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Dot extends Model {
    static associate(models) {
      Dot.belongsTo(models.Road, {
        foreignKey: 'RoadID',
        as: 'road'
      });
    }
  }
  Dot.init({
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ThisDotCoordinates: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    NextDotCoordinates: {
      type: DataTypes.STRING(255)
    },
    RoadID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roads',
        key: 'ID'
      }
    }
  }, {
    sequelize,
    modelName: 'Dot',
    tableName: 'dots',
    timestamps: false
  });
  return Dot;
};