"use strict";

/**
 * Migration: Make grade_master_id nullable
 *
 * Grade is optional for unprocessed products, so grade_master_id column
 * should allow NULL values.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const sequelize = queryInterface.sequelize;

      console.log("📝 Making grade_master_id nullable using raw SQL...");

      // Use raw SQL to alter the column constraint
      await sequelize.query(`
        ALTER TABLE packing 
        ALTER COLUMN grade_master_id DROP NOT NULL;
      `);

      console.log("✅ grade_master_id column is now nullable");
      return true;
    } catch (error) {
      console.error("❌ Migration error:", error?.message || error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const sequelize = queryInterface.sequelize;

      console.log("📝 Reverting: Making grade_master_id NOT NULL...");

      // Set any NULL values to a default UUID before making it NOT NULL
      await sequelize.query(`
        UPDATE packing 
        SET grade_master_id = '00000000-0000-0000-0000-000000000000'
        WHERE grade_master_id IS NULL;
      `);

      // Now make it NOT NULL again
      await sequelize.query(`
        ALTER TABLE packing 
        ALTER COLUMN grade_master_id SET NOT NULL;
      `);

      console.log("✅ Rollback completed");
      return true;
    } catch (error) {
      console.error("❌ Rollback error:", error?.message || error);
      throw error;
    }
  },
};
