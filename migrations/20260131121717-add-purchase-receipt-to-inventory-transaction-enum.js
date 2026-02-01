"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add PURCHASE_RECEIPT to the inventory_transaction transaction_type enum
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_inventory_transaction_transaction_type"
      ADD VALUE 'PURCHASE_RECEIPT';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This migration is not reversible
    console.log(
      "Cannot remove PURCHASE_RECEIPT from enum - migration not reversible",
    );
  },
};
