"use strict";

/**
 * Create species_group_derivative_rule Table
 *
 * This table defines yield rules for each species group and derivative combination.
 * It enables precise calculation of:
 * - Yield percentage (min/max range)
 * - Piece count per unit
 * - Processing loss category
 * - Priority order for multi-path processing
 *
 * Example: ROUND_FISH → FILLET yields 38-45% with 2 pieces per fish
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Create the table
      await queryInterface.createTable(
        "species_group_derivative_rule",
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
            comment: "Unique identifier",
          },
          species_group_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: "species_master",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            comment:
              "Reference to species_master (represents group like ROUND_FISH)",
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
          pieces_per_unit: {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: 1,
            comment:
              "Number of pieces this derivative produces per unit (e.g., 2 fillets per round fish)",
          },
          yield_min: {
            type: Sequelize.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0,
            validate: {
              min: 0,
              max: 100,
            },
            comment: "Minimum yield percentage (0-100)",
          },
          yield_max: {
            type: Sequelize.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 100,
            validate: {
              min: 0,
              max: 100,
            },
            comment: "Maximum yield percentage (0-100)",
          },
          priority_order: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 99,
            comment:
              "Priority order for processing (lower = higher priority). 99 = waste/byproduct",
          },
          loss_category: {
            type: Sequelize.ENUM(
              "PRIMARY", // Main product (40-60% yield)
              "SECONDARY", // Co-product (10-30% yield)
              "TRIM", // Trimmings (3-15% yield)
              "WASTE" // Non-edible waste (process residue)
            ),
            allowNull: true,
            defaultValue: "WASTE",
            comment: "Category of loss/output",
          },
          is_active: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            comment: "Soft delete flag",
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
        },
        {
          comment: "Yield rules for species-to-derivative processing",
        }
      );

      // Create indexes for efficient queries
      await queryInterface.addIndex(
        "species_group_derivative_rule",
        ["species_group_id"],
        {
          name: "idx_species_group_derivative_rule_species_group_id",
        }
      );

      await queryInterface.addIndex(
        "species_group_derivative_rule",
        ["derivative_id"],
        {
          name: "idx_species_group_derivative_rule_derivative_id",
        }
      );

      await queryInterface.addIndex(
        "species_group_derivative_rule",
        ["species_group_id", "derivative_id"],
        {
          name: "idx_species_group_derivative_rule_composite",
          unique: true,
        }
      );

      await queryInterface.addIndex(
        "species_group_derivative_rule",
        ["priority_order"],
        {
          name: "idx_species_group_derivative_rule_priority",
        }
      );

      console.log(
        "✅ species_group_derivative_rule table created successfully"
      );
    } catch (error) {
      console.error(
        "Error creating species_group_derivative_rule table:",
        error
      );
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Drop indexes
      await queryInterface.removeIndex(
        "species_group_derivative_rule",
        "idx_species_group_derivative_rule_species_group_id"
      );

      await queryInterface.removeIndex(
        "species_group_derivative_rule",
        "idx_species_group_derivative_rule_derivative_id"
      );

      await queryInterface.removeIndex(
        "species_group_derivative_rule",
        "idx_species_group_derivative_rule_composite"
      );

      await queryInterface.removeIndex(
        "species_group_derivative_rule",
        "idx_species_group_derivative_rule_priority"
      );

      // Drop the table
      await queryInterface.dropTable("species_group_derivative_rule");

      console.log(
        "✅ species_group_derivative_rule table dropped successfully"
      );
    } catch (error) {
      console.error(
        "Error dropping species_group_derivative_rule table:",
        error
      );
      throw error;
    }
  },
};
