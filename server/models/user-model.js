'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
   
    static associate(models) {

      User.hasMany(models.Photo, {
        foreignKey: 'UserID',
        as: 'photos'
      });
      User.hasMany(models.Road, {
        foreignKey: 'UserID',
        as: 'roads'
      });
      User.hasMany(models.Vote, {
        foreignKey: 'UserID',
        as: 'votes'
      });
    }
  }
  User.init({
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    Email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    FIO: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    }
  }, {
    sequelize,
    modelName: 'User', 
    tableName: 'user', 
    timestamps: false 
  });
  return User;
};