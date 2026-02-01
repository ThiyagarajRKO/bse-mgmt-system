"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'dispatched' to the delivery_status enum
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_orders_delivery_status" ADD VALUE 'dispatched';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing values from enums
    // This migration is irreversible
  },
};
