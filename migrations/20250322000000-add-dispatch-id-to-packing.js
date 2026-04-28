"use strict";

/**
 * Migration: Add dispatch_id column to packing table
 * Purpose: Support packing unprocessed products directly from dispatch (skip peeling/QA)
 *
 * For unprocessed seafood:
 * - Dispatch → Packing (no peeling, no QA)
 * - peeled_dispatched_product_id is NULL
 * - dispatch_id is populated
 *
 * For processed seafood:
 * - Dispatch → Peeling → QA → Peeled Dispatch → Packing
 * - peeled_dispatched_product_id is populated
 * - dispatch_id is NULL
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Add new dispatch_id column (nullable - for unprocessed products)
      // Check if column already exists first
      const table = await queryInterface.describeTable("packing");
      if (!table.dispatch_id) {
        await queryInterface.addColumn("packing", "dispatch_id", {
          type: Sequelize.UUID,
          allowNull: true,
          onDelete: "RESTRICT",
          onUpdate: "CASCADE",
          references: {
            model: "dispatches",
            key: "id",
          },
        });
      }

      console.log(
        "✅ Migration completed: Added dispatch_id to packing table for unprocessed product support",
      );
    } catch (error) {
      console.error("Migration error:", error?.message || error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove dispatch_id column if rolling back
      const table = await queryInterface.describeTable("packing");
      if (table.dispatch_id) {
        await queryInterface.removeColumn("packing", "dispatch_id");
      }

      console.log(
        "✅ Migration reverted: Removed dispatch_id from packing table",
      );
    } catch (error) {
      console.error("Migration rollback error:", error?.message || error);
      throw error;
    }
  },
};
