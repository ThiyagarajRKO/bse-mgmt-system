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
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Make peeled_dispatched_product_id nullable (was previously required)
      await queryInterface.changeColumn(
        "packing",
        "peeled_dispatched_product_id",
        {
          type: Sequelize.UUID,
          allowNull: true, // Changed from false to true
          onDelete: "RESTRICT",
          onUpdate: "CASCADE",
          references: {
            model: { tableName: "peeled_dispatches" },
            key: "id",
          },
        },
        { transaction },
      );

      // Add new dispatch_id column (nullable - for unprocessed products)
      await queryInterface.addColumn(
        "packing",
        "dispatch_id",
        {
          type: Sequelize.UUID,
          allowNull: true,
          onDelete: "RESTRICT",
          onUpdate: "CASCADE",
          references: {
            model: { tableName: "dispatches" },
            key: "id",
          },
        },
        { transaction },
      );

      // Make peeled_product_id nullable (was previously required)
      // This is the peeling_product association - may not exist for unprocessed
      await queryInterface.changeColumn(
        "packing",
        "peeled_product_id",
        {
          type: Sequelize.UUID,
          allowNull: true, // Changed from false to true
          onDelete: "RESTRICT",
          onUpdate: "CASCADE",
          references: {
            model: { tableName: "peeling_products" },
            key: "id",
          },
        },
        { transaction },
      );

      await transaction.commit();
      console.log(
        "✅ Migration completed: Added dispatch_id to packing table and made peeled references nullable",
      );
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Remove dispatch_id column
      await queryInterface.removeColumn("packing", "dispatch_id", {
        transaction,
      });

      // Revert peeled_dispatched_product_id to NOT NULL
      await queryInterface.changeColumn(
        "packing",
        "peeled_dispatched_product_id",
        {
          type: Sequelize.UUID,
          allowNull: false, // Revert to original
          onDelete: "RESTRICT",
          onUpdate: "CASCADE",
          references: {
            model: { tableName: "peeled_dispatches" },
            key: "id",
          },
        },
        { transaction },
      );

      // Revert peeled_product_id to NOT NULL
      await queryInterface.changeColumn(
        "packing",
        "peeled_product_id",
        {
          type: Sequelize.UUID,
          allowNull: false, // Revert to original
          onDelete: "RESTRICT",
          onUpdate: "CASCADE",
          references: {
            model: { tableName: "peeling_products" },
            key: "id",
          },
        },
        { transaction },
      );

      await transaction.commit();
      console.log(
        "✅ Migration reverted: Removed dispatch_id and reverted nullable columns",
      );
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
