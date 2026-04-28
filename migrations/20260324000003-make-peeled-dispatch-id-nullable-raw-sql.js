"use strict";

/**
 * Migration: Make peeled_dispatch_id nullable (FORCE)
 *
 * Previous migration didn't work because of how constraints are handled.
 * This migration uses raw SQL to force the column to be nullable.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const sequelize = queryInterface.sequelize;

      console.log("📝 Making peeled_dispatch_id nullable using raw SQL...");

      // Use raw SQL to alter the column constraint
      await sequelize.query(`
        ALTER TABLE packing 
        ALTER COLUMN peeled_dispatch_id DROP NOT NULL;
      `);

      console.log("✅ peeled_dispatch_id column is now nullable");
      return true;
    } catch (error) {
      console.error("❌ Migration error:", error?.message || error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const sequelize = queryInterface.sequelize;

      console.log("📝 Reverting: Making peeled_dispatch_id NOT NULL...");

      // Set any NULL values to a default UUID before making it NOT NULL
      await sequelize.query(`
        UPDATE packing 
        SET peeled_dispatch_id = '00000000-0000-0000-0000-000000000000'
        WHERE peeled_dispatch_id IS NULL;
      `);

      // Now make it NOT NULL again
      await sequelize.query(`
        ALTER TABLE packing 
        ALTER COLUMN peeled_dispatch_id SET NOT NULL;
      `);

      console.log("✅ Rollback completed");
      return true;
    } catch (error) {
      console.error("❌ Rollback error:", error?.message || error);
      throw error;
    }
  },
};
