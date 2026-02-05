"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Change the default value from ALLOCATED to PENDING_PURCHASE
    await queryInterface.sequelize.query(`
      ALTER TABLE allocation_master
      ALTER COLUMN status SET DEFAULT 'PENDING_PURCHASE';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert the default back to ALLOCATED
    await queryInterface.sequelize.query(`
      ALTER TABLE allocation_master
      ALTER COLUMN status SET DEFAULT 'ALLOCATED';
    `);
  },
};
