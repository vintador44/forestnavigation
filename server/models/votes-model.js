'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Vote extends Model {
    static associate(models) {
      Vote.belongsTo(models.User, {
        foreignKey: 'UserID',
        as: 'user'
      });
      Vote.belongsTo(models.Road, {
        foreignKey: 'RoadID',
        as: 'road'
      });
    }
  }
  Vote.init({
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
    RoadID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roads',
        key: 'ID'
      }
    },
    Vote: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Vote',
    tableName: 'votes',
    timestamps: false
  });
  return Vote;
};