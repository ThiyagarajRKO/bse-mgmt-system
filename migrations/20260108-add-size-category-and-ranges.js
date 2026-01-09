"use strict";

/**
 * Add size_category and min/max value fields to size_master
 *
 * Adds fields to support comprehensive size tracking:
 * - size_category: FISH, SHRIMP, CEPHALOPOD, CRUSTACEAN, BIVALVE
 * - min_value: Lower bound (in appropriate unit)
 * - max_value: Upper bound (in appropriate unit)
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log("Adding size category and range fields to size_master...");

      const table = await queryInterface.describeTable("size_master");

      // Add size_category
      if (!table.size_category) {
        await queryInterface.addColumn("size_master", "size_category", {
          type: Sequelize.STRING(50),
          allowNull: true,
          comment: "Category: FISH, SHRIMP, CEPHALOPOD, CRUSTACEAN, BIVALVE",
        });
        console.log("✅ Added size_category column");
      }

      // Add min_value
      if (!table.min_value) {
        await queryInterface.addColumn("size_master", "min_value", {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true,
          comment: "Minimum value in appropriate unit",
        });
        console.log("✅ Added min_value column");
      }

      // Add max_value
      if (!table.max_value) {
        await queryInterface.addColumn("size_master", "max_value", {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true,
          comment: "Maximum value in appropriate unit",
        });
        console.log("✅ Added max_value column");
      }

      console.log("✅ All fields added successfully");
    } catch (error) {
      console.error("❌ Error adding fields to size_master:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log(
        "Removing size category and range fields from size_master..."
      );

      const table = await queryInterface.describeTable("size_master");

      if (table.size_category) {
        await queryInterface.removeColumn("size_master", "size_category");
      }

      if (table.min_value) {
        await queryInterface.removeColumn("size_master", "min_value");
      }

      if (table.max_value) {
        await queryInterface.removeColumn("size_master", "max_value");
      }

      console.log("✅ Fields removed successfully");
    } catch (error) {
      console.error("Error removing fields:", error);
      throw error;
    }
  },
};
