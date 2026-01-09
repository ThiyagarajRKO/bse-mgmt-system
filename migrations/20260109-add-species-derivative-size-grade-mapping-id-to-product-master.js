"use strict";

/**
 * Migration: Add 4D Mapping Reference to Product Master
 *
 * Links each product to a specific validated combination of:
 * species × derivative × size × grade
 *
 * This ensures product creation follows the 4D mapping rules and constraints.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log(
        "Adding species_derivative_size_grade_mapping_id to product_master..."
      );

      // Check if column already exists
      const table = await queryInterface.describeTable("product_master");

      if (table.species_derivative_size_grade_mapping_id) {
        console.log(
          "✅ Column species_derivative_size_grade_mapping_id already exists"
        );
        return;
      }

      // Add the column
      await queryInterface.addColumn(
        "product_master",
        "species_derivative_size_grade_mapping_id",
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: "species_derivative_size_grade_mapping",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
          comment:
            "4D Mapping ID: Links to validated combination of species × derivative × size × grade. Ensures only valid combinations are used.",
        }
      );

      console.log("✅ Column added successfully");

      // Add index for faster lookups
      await queryInterface.addIndex("product_master", {
        fields: ["species_derivative_size_grade_mapping_id"],
        name: "idx_product_4d_mapping_id",
      });

      console.log(
        "✅ Index created on species_derivative_size_grade_mapping_id"
      );
    } catch (error) {
      console.error("❌ Error adding column:", error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log(
        "Removing species_derivative_size_grade_mapping_id from product_master..."
      );

      const table = await queryInterface.describeTable("product_master");

      if (!table.species_derivative_size_grade_mapping_id) {
        console.log(
          "✅ Column species_derivative_size_grade_mapping_id does not exist"
        );
        return;
      }

      // Remove index
      await queryInterface.removeIndex(
        "product_master",
        "idx_product_4d_mapping_id"
      );

      // Remove column
      await queryInterface.removeColumn(
        "product_master",
        "species_derivative_size_grade_mapping_id"
      );

      console.log("✅ Column and index removed successfully");
    } catch (error) {
      console.error("Error removing column:", error.message);
      throw error;
    }
  },
};
