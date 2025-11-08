'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('locations', {
      ID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      LocationName: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      Coordinates: {
        type: Sequelize.GEOGRAPHY('point'),
        allowNull: false
      },
      Description: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      Categories: {
        type: Sequelize.INTEGER,
        references: {
          model: 'categories',
          key: 'ID'
        }
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('locations');
  }
};