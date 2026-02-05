"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("🔄 Starting to fix existing order allocation statuses...");

    // Simple approach: Update all sales_allocations to PENDING status
    // so they can be re-evaluated with the corrected allocation logic
    await queryInterface.sequelize.query(`
      UPDATE sales_allocations
      SET allocation_status = 'PENDING',
          updated_at = CURRENT_TIMESTAMP
      WHERE allocation_status NOT IN ('PENDING', 'COMPLETED')
    `);

    console.log(
      "✅ Updated sales allocations to PENDING status where appropriate",
    );
    console.log("✅ Migration completed successfully");
  },

  async down(queryInterface, Sequelize) {
    // This migration is not reversible as it corrects data based on current inventory
    console.log(
      "⚠️  This migration cannot be reversed as it corrects allocation statuses based on current inventory state",
    );
  },
};
