'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createSchema('auth')
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropSchema('auth');
  }
};