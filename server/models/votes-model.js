'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Votes extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Votes.init({
    ID: DataTypes.INTEGER,
    UserID: DataTypes.INTEGER,
    RoadID: DataTypes.INTEGER,
    Vote: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'votes',
  });
  return Votes;
};