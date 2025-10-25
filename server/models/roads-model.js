'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Roads extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Roads.init({
    ID: DataTypes.INTEGER,
    Description: DataTypes.STRING,
    UserID: DataTypes.INTEGER,
    StartDateTime: DataTypes.DATE,
    EndDateTime: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'roads',
  });
  return Roads;
};