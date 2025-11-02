'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
     
      Category.hasMany(models.Location, {
        foreignKey: 'Categories',
        as: 'locations'
      });
    }
  }
  Category.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    CategoryName: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Category', 
    tableName: 'categories',
    timestamps: false
  });
  return Category;
};