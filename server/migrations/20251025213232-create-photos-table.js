'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('photos', {
      ID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      UserID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'user',
          key: 'ID'
        }
      },
      LocationID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        refernces: {
          model: 'locations',
          key: 'ID'
        }
      },
      PhotoBYTEA: {
        type: Sequelize.BLOB,
        allowNull: false
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('photos');
  }
};