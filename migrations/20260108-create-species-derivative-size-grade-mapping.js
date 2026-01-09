"use strict";

/**
 * CREATE SPECIES × DERIVATIVE × SIZE × GRADE MAPPING TABLE
 *
 * Comprehensive 4-dimensional mapping for product lifecycle:
 * - Species (Fish, Shrimp, Tuna, etc.)
 * - Derivative (form: Whole, Fillet, Loin, etc.)
 * - Size (weight/count range: 0.5-2kg, 2-5kg, etc.)
 * - Grade (quality tier: A, B, C, D)
 *
 * Used for:
 * - Product creation validation
 * - Pricing engine
 * - Yield planning
 * - Inventory management
 * - Quality enforcement
 *
 * Examples:
 * - Fish + Whole + 0.5-2kg + Grade B → Export market
 * - Tuna + Loin + 1-10kg + Grade A → Sashimi market
 * - Shrimp + Whole + 15-30/kg + Grade C → Processing
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log("Creating species_derivative_size_grade_mapping table...");

      const tableExists = await queryInterface.sequelize.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'species_derivative_size_grade_mapping' LIMIT 1`
      );

      if (tableExists[0] && tableExists[0].length > 0) {
        console.log("✅ Table already exists, skipping...");
        return;
      }

      await queryInterface.createTable(
        "species_derivative_size_grade_mapping",
        {
          id: {
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
          },
          // Foreign Keys
          species_master_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: "species_master",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
          derivative_master_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: "derivative_master",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
          size_master_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: "size_master",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
          // Grade Flags (one grade per mapping - not all)
          grade_master_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: "grade_master",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
          // Business Logic Fields
          is_viable: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            comment: "Is this combination economically viable?",
          },
          viability_reason: {
            type: Sequelize.TEXT,
            comment: "Why viable or not (market demand, cost, yield, etc.)",
          },
          market_segment: {
            type: Sequelize.STRING(100),
            comment:
              "Target market: Premium/Sashimi, Export, Retail, Domestic, Processing, Industrial",
          },
          expected_yield_percent: {
            type: Sequelize.DECIMAL(5, 2),
            defaultValue: 85.0,
            comment: "Expected yield from raw material (%)",
          },
          processing_difficulty: {
            type: Sequelize.ENUM("Easy", "Medium", "Hard", "Very_Hard"),
            defaultValue: "Medium",
            comment: "Labor/equipment complexity",
          },
          storage_temperature_celsius: {
            type: Sequelize.INTEGER,
            comment: "Required storage temperature (-18, -4, 4, room temp)",
          },
          shelf_life_days: {
            type: Sequelize.INTEGER,
            comment: "Maximum shelf life in appropriate storage",
          },
          recommended_supplier_types: {
            type: Sequelize.ARRAY(Sequelize.STRING),
            defaultValue: [],
            comment: "Array: [Domestic, Import, Aquaculture, Wild Caught]",
          },
          certification_requirements: {
            type: Sequelize.ARRAY(Sequelize.STRING),
            defaultValue: [],
            comment: "Array: [MSC, ASC, Organic, Kosher, Halal]",
          },
          packaging_type_preferred: {
            type: Sequelize.STRING(100),
            comment: "IQF, Block, Skin Pack, Vacuum, Carton, etc.",
          },
          pricing_tier: {
            type: Sequelize.ENUM("Premium", "Standard", "Value", "Economy"),
            defaultValue: "Standard",
            comment: "Affects pricing strategy",
          },
          weight_loss_percent_thaw: {
            type: Sequelize.DECIMAL(5, 2),
            defaultValue: 3.0,
            comment: "Expected weight loss during thawing (%)",
          },
          // Status & Audit
          is_active: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.fn("now"),
          },
          updated_at: {
            type: Sequelize.DATE,
          },
          deleted_at: {
            type: Sequelize.DATE,
          },
          created_by: {
            type: Sequelize.UUID,
            allowNull: false,
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
            onDelete: "SET NULL",
          },
          deleted_by: {
            type: Sequelize.UUID,
            references: {
              model: "user_profiles",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
          },
        }
      );

      // Create indexes for fast lookups and filtering
      await queryInterface.addIndex("species_derivative_size_grade_mapping", {
        fields: ["species_master_id", "is_active"],
        name: "idx_spec_deriv_size_grade_species_active",
      });

      await queryInterface.addIndex("species_derivative_size_grade_mapping", {
        fields: ["derivative_master_id", "is_active"],
        name: "idx_spec_deriv_size_grade_deriv_active",
      });

      await queryInterface.addIndex("species_derivative_size_grade_mapping", {
        fields: ["size_master_id", "grade_master_id"],
        name: "idx_spec_deriv_size_grade_size_grade",
      });

      await queryInterface.addIndex("species_derivative_size_grade_mapping", {
        fields: ["market_segment", "pricing_tier", "is_viable"],
        name: "idx_spec_deriv_size_grade_market_pricing",
      });

      await queryInterface.addIndex("species_derivative_size_grade_mapping", {
        fields: ["is_viable", "is_active"],
        name: "idx_spec_deriv_size_grade_viable",
      });

      console.log("✅ Table created with 5 indexes and foreign keys");
    } catch (error) {
      console.error("❌ Error creating table:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log("Dropping species_derivative_size_grade_mapping table...");

      const tableExists = await queryInterface.sequelize.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'species_derivative_size_grade_mapping' LIMIT 1`
      );

      if (!tableExists[0] || tableExists[0].length === 0) {
        console.log("✅ Table doesn't exist, skipping...");
        return;
      }

      // Drop indexes
      await queryInterface
        .removeIndex(
          "species_derivative_size_grade_mapping",
          "idx_spec_deriv_size_grade_species_active"
        )
        .catch(() => {});

      await queryInterface
        .removeIndex(
          "species_derivative_size_grade_mapping",
          "idx_spec_deriv_size_grade_deriv_active"
        )
        .catch(() => {});

      await queryInterface
        .removeIndex(
          "species_derivative_size_grade_mapping",
          "idx_spec_deriv_size_grade_size_grade"
        )
        .catch(() => {});

      await queryInterface
        .removeIndex(
          "species_derivative_size_grade_mapping",
          "idx_spec_deriv_size_grade_market_pricing"
        )
        .catch(() => {});

      await queryInterface
        .removeIndex(
          "species_derivative_size_grade_mapping",
          "idx_spec_deriv_size_grade_viable"
        )
        .catch(() => {});

      // Drop table
      await queryInterface.dropTable("species_derivative_size_grade_mapping");

      console.log("✅ Table dropped successfully");
    } catch (error) {
      console.error("Error dropping table:", error);
      throw error;
    }
  },
};
