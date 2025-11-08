'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('dots', {
      ID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ThisDotCoordinates: {
        type: Sequelize.GEOGRAPHY('point'),
        allowNull: false
      },
      NextDotCoordinates: {
        type: Sequelize.GEOGRAPHY('point'),
        allowNull: false
      },
      RoadID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'roads',
          key: 'ID'
        }
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('dots');
  }
};