"use strict";

/**
 * Migration: Add product control flags (is_producible, is_sellable)
 * These control whether a product can be produced or sold in the ERP
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log("\n🚩 Adding product control flags...");

      // Add is_producible (default true for backward compatibility)
      console.log("   ➕ Adding is_producible column...");
      await queryInterface.addColumn(
        "product_master",
        "is_producible",
        {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false,
          comment:
            "False for RAW (inputs), true for processed (can be produced)",
        },
        { transaction }
      );

      // Add is_sellable (default true - most products are sellable)
      console.log("   ➕ Adding is_sellable column...");
      await queryInterface.addColumn(
        "product_master",
        "is_sellable",
        {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false,
          comment: "Whether product can be sold to customers",
        },
        { transaction }
      );

      // Create indexes for performance
      console.log("   🔍 Creating indexes...");
      await queryInterface.addIndex("product_master", ["is_producible"], {
        name: "idx_product_is_producible",
        transaction,
      });

      await queryInterface.addIndex("product_master", ["is_sellable"], {
        name: "idx_product_is_sellable",
        transaction,
      });

      await transaction.commit();
      console.log("✅ Product flags migration completed successfully\n");
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Error in product flags migration:", error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log("\n🔄 Reverting product flags...");

      // Remove indexes
      await queryInterface.removeIndex(
        "product_master",
        "idx_product_is_producible",
        { transaction }
      );
      await queryInterface.removeIndex(
        "product_master",
        "idx_product_is_sellable",
        {
          transaction,
        }
      );

      // Remove columns
      await queryInterface.removeColumn("product_master", "is_producible", {
        transaction,
      });
      await queryInterface.removeColumn("product_master", "is_sellable", {
        transaction,
      });

      await transaction.commit();
      console.log("✅ Product flags rollback completed\n");
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Error reverting product flags:", error.message);
      throw error;
    }
  },
};
