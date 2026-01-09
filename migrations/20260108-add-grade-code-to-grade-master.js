"use strict";

/**
 * Add grade_code column to grade_master table
 *
 * Adds a unique code field to represent grades:
 * A = Premium Export
 * B = Standard Export
 * C = Domestic / Processing
 * D = Industrial
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log("Adding grade_code column to grade_master...");

      // Check if column already exists
      const table = await queryInterface.describeTable("grade_master");

      if (!table.grade_code) {
        await queryInterface.addColumn("grade_master", "grade_code", {
          type: Sequelize.STRING(1),
          allowNull: true,
          unique: true,
          comment:
            "Grade code: A (Premium Export), B (Standard Export), C (Domestic/Processing), D (Industrial)",
        });

        console.log("✅ grade_code column added successfully");
      } else {
        console.log("✅ grade_code column already exists, skipping...");
      }
    } catch (error) {
      console.error("❌ Error adding grade_code column:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log("Removing grade_code column from grade_master...");

      const table = await queryInterface.describeTable("grade_master");

      if (table.grade_code) {
        await queryInterface.removeColumn("grade_master", "grade_code");
        console.log("✅ grade_code column removed successfully");
      }
    } catch (error) {
      console.error("Error removing grade_code column:", error);
      throw error;
    }
  },
};
