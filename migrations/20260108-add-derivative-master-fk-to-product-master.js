"use strict";

/**
 * Add derivative_master foreign key to product_master
 * This migration adds the relationship between product_master and derivative_master
 * allowing products to be categorized by their processing level
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Check if column already exists
      const table = await queryInterface.describeTable("product_master");

      if (!table.derivative_master_id) {
        // Add the foreign key column
        await queryInterface.addColumn(
          "product_master",
          "derivative_master_id",
          {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: "derivative_master",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
            comment:
              "Foreign key reference to derivative_master. Defines the processing level (Raw, Cooked, RTC, etc.)",
          }
        );

        // Create index for better query performance
        await queryInterface.addIndex(
          "product_master",
          ["derivative_master_id"],
          {
            name: "idx_product_master_derivative_master_id",
          }
        );
      }
    } catch (error) {
      console.error("Error adding derivative_master_id column:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      const table = await queryInterface.describeTable("product_master");

      if (table.derivative_master_id) {
        // Remove the index
        await queryInterface.removeIndex(
          "product_master",
          "idx_product_master_derivative_master_id"
        );

        // Remove the foreign key column
        await queryInterface.removeColumn(
          "product_master",
          "derivative_master_id"
        );
      }
    } catch (error) {
      console.error("Error removing derivative_master_id column:", error);
      throw error;
    }
  },
};
