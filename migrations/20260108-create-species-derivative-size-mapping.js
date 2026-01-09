"use strict";

/**
 * Create species_derivative_size_mapping Table
 *
 * This table creates a comprehensive mapping matrix:
 * Species → Derivatives → Sizes
 *
 * Enables:
 * - Product creation with automatic recommendations
 * - Yield calculations with size-aware outputs
 * - Pricing by species, derivative, and size combination
 * - Inventory tracking across all dimensions
 * - Production planning with complete visibility
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log("Creating species_derivative_size_mapping table...");

      await queryInterface.createTable(
        "species_derivative_size_mapping",
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
            comment: "Unique identifier",
          },
          species_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: "species_master",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            comment: "Reference to species_master",
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
            comment: "Reference to derivative_master",
          },
          size_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: "size_master",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            comment: "Reference to size_master",
          },
          priority_order: {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: 99,
            comment: "Priority for recommendations (lower = higher priority)",
          },
          is_applicable: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: "Whether this combination is applicable/available",
          },
          notes: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: "Additional notes about this mapping",
          },
          is_active: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            comment: "Soft delete flag",
          },
          created_by: {
            type: Sequelize.UUID,
            references: {
              model: "user_profiles",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
          updated_by: {
            type: Sequelize.UUID,
            references: {
              model: "user_profiles",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
          deleted_by: {
            type: Sequelize.UUID,
            references: {
              model: "user_profiles",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
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
          deleted_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
        },
        {
          comment: "Mapping table for species → derivative → size combinations",
        }
      );

      // Create indexes for efficient queries
      await queryInterface.addIndex(
        "species_derivative_size_mapping",
        ["species_id"],
        {
          name: "idx_species_derivative_size_mapping_species_id",
        }
      );

      await queryInterface.addIndex(
        "species_derivative_size_mapping",
        ["derivative_id"],
        {
          name: "idx_species_derivative_size_mapping_derivative_id",
        }
      );

      await queryInterface.addIndex(
        "species_derivative_size_mapping",
        ["size_id"],
        {
          name: "idx_species_derivative_size_mapping_size_id",
        }
      );

      await queryInterface.addIndex(
        "species_derivative_size_mapping",
        ["species_id", "derivative_id", "size_id"],
        {
          name: "idx_species_derivative_size_mapping_composite",
          unique: true,
        }
      );

      await queryInterface.addIndex(
        "species_derivative_size_mapping",
        ["priority_order"],
        {
          name: "idx_species_derivative_size_mapping_priority",
        }
      );

      console.log(
        "✅ species_derivative_size_mapping table created successfully"
      );
    } catch (error) {
      console.error(
        "Error creating species_derivative_size_mapping table:",
        error
      );
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Drop indexes
      await queryInterface.removeIndex(
        "species_derivative_size_mapping",
        "idx_species_derivative_size_mapping_species_id"
      );

      await queryInterface.removeIndex(
        "species_derivative_size_mapping",
        "idx_species_derivative_size_mapping_derivative_id"
      );

      await queryInterface.removeIndex(
        "species_derivative_size_mapping",
        "idx_species_derivative_size_mapping_size_id"
      );

      await queryInterface.removeIndex(
        "species_derivative_size_mapping",
        "idx_species_derivative_size_mapping_composite"
      );

      await queryInterface.removeIndex(
        "species_derivative_size_mapping",
        "idx_species_derivative_size_mapping_priority"
      );

      // Drop the table
      await queryInterface.dropTable("species_derivative_size_mapping");

      console.log(
        "✅ species_derivative_size_mapping table dropped successfully"
      );
    } catch (error) {
      console.error(
        "Error dropping species_derivative_size_mapping table:",
        error
      );
      throw error;
    }
  },
};
