"use strict";

/**
 * Migration: Create species_derivative_mapping table
 *
 * This table stores the allowed/blocked derivatives for each species type.
 * It provides a database-backed validation layer for the species-derivative matrix.
 *
 * Tables:
 * - species_derivative_mapping: Maps species types to allowed derivatives
 * - species_derivative_blocked: Tracks blocked derivatives for each species
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Create species_derivative_mapping table
      await queryInterface.createTable("species_derivative_mapping", {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        species_type: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment:
            "Species type key (e.g., CRUSTACEAN_SHRIMP, FINFISH, CEPHALOPOD)",
        },
        species_description: {
          type: Sequelize.STRING(255),
          allowNull: false,
          comment: "Human-readable description of the species type",
        },
        derivative_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: "derivative_master",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          comment: "Foreign key to derivative_master",
        },
        is_allowed: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false,
          comment: "TRUE if derivative is allowed, FALSE if blocked",
        },
        reason: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment:
            "Reason for blocking (if is_allowed = FALSE), e.g., 'Shrimp-specific only'",
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      });

      // Create unique index to prevent duplicates
      await queryInterface.addIndex("species_derivative_mapping", [
        "species_type",
        "derivative_id",
      ]);

      // Create index for species_type for faster lookups
      await queryInterface.addIndex("species_derivative_mapping", [
        "species_type",
      ]);

      // Create index for is_allowed for filtering
      await queryInterface.addIndex("species_derivative_mapping", [
        "is_allowed",
      ]);

      console.log("✅ Created species_derivative_mapping table");
    } catch (error) {
      console.error("❌ Error creating tables:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.dropTable("species_derivative_mapping");
      console.log("✅ Dropped species_derivative_mapping table");
    } catch (error) {
      console.error("❌ Error dropping tables:", error);
      throw error;
    }
  },
};
