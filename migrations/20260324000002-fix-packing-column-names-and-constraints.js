"use strict";

/**
 * Migration: Fix packing table column names and constraints
 *
 * Issues to fix:
 * 1. Column was named "peeled_dispatched_product_id" but model expects "peeled_dispatch_id"
 * 2. "peeled_product_id" column is not used by current model
 * 3. "peeled_dispatch_id" needs to be nullable for unprocessed products
 *
 * For unprocessed products (Dispatch → Packing):
 * - peeled_dispatch_id: NULL
 * - dispatch_id: populated
 *
 * For processed products (Dispatch → Peeling → QA → Peeled Dispatch → Packing):
 * - peeled_dispatch_id: populated
 * - dispatch_id: NULL
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const table = await queryInterface.describeTable("packing");

      // Step 1: Rename peeled_dispatched_product_id to peeled_dispatch_id if it exists
      if (table.peeled_dispatched_product_id && !table.peeled_dispatch_id) {
        console.log(
          "📝 Renaming peeled_dispatched_product_id → peeled_dispatch_id",
        );
        await queryInterface.renameColumn(
          "packing",
          "peeled_dispatched_product_id",
          "peeled_dispatch_id",
        );
      }

      // Step 2: Remove peeled_product_id if it exists (not used by current model)
      if (table.peeled_product_id) {
        console.log("📝 Removing unused peeled_product_id column");
        await queryInterface.removeColumn("packing", "peeled_product_id");
      }

      // Step 3: Refresh table info and make peeled_dispatch_id nullable
      const updatedTable = await queryInterface.describeTable("packing");
      if (
        updatedTable.peeled_dispatch_id &&
        updatedTable.peeled_dispatch_id.allowNull === false
      ) {
        console.log(
          "📝 Making peeled_dispatch_id nullable for unprocessed products",
        );
        await queryInterface.changeColumn("packing", "peeled_dispatch_id", {
          type: Sequelize.UUID,
          allowNull: true, // ✅ Now nullable to support unprocessed products
          onDelete: "RESTRICT",
          onUpdate: "CASCADE",
          references: {
            model: "peeled_dispatches",
            key: "id",
          },
        });
      }

      console.log(
        "✅ Migration completed: Fixed packing table column names and constraints",
      );
    } catch (error) {
      console.error("❌ Migration error:", error?.message || error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const table = await queryInterface.describeTable("packing");

      // Reverse: Rename peeled_dispatch_id back to peeled_dispatched_product_id
      if (table.peeled_dispatch_id) {
        console.log(
          "📝 Reverting: Renaming peeled_dispatch_id → peeled_dispatched_product_id",
        );
        await queryInterface.renameColumn(
          "packing",
          "peeled_dispatch_id",
          "peeled_dispatched_product_id",
        );
      }

      // Reverse: Make peeled_dispatched_product_id NOT NULL again
      const revertedTable = await queryInterface.describeTable("packing");
      if (revertedTable.peeled_dispatched_product_id) {
        await queryInterface.changeColumn(
          "packing",
          "peeled_dispatched_product_id",
          {
            type: Sequelize.UUID,
            allowNull: false,
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
            references: {
              model: "peeled_dispatches",
              key: "id",
            },
          },
        );
      }

      console.log("✅ Rollback completed");
    } catch (error) {
      console.error("❌ Rollback error:", error?.message || error);
      throw error;
    }
  },
};
