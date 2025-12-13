"use strict";

/**
 * Species Size Mapping Migration
 *
 * This migration creates the species_size_mapping table which establishes
 * valid relationships between species (parent_category_type) and available sizes.
 *
 * Purpose:
 * - Map species characteristics (parent_category_type) to appropriate size units
 * - Enable automatic size recommendations based on species type
 * - Enforce business rules: e.g., Fish can use weights (g, kg), Crustaceans can use count (pcs/kg, pcs/lb)
 *
 * Relationships:
 * - Many-to-many through species_master.parent_category_type and size_master.unit_of_measure
 * - Can be expanded to include per-species mappings if needed
 *
 * Example mappings:
 * - Fish + [g, kg, pcs/kg] - Fish typically sold by weight or count per unit
 * - Bivalve + [cm, count] - Bivalves typically measured by shell size or count
 * - Crustacean + [pcs/kg, pcs/lb, kg] - Crustaceans typically by count or weight
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // ============================================================================
      // STEP 1: Create species_size_mapping table if it doesn't exist
      // ============================================================================
      const tableExists = await queryInterface.tableExists(
        "species_size_mapping"
      );

      if (!tableExists) {
        await queryInterface.createTable("species_size_mapping", {
          id: {
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
          },
          parent_category_type: {
            type: Sequelize.ENUM(
              "Bivalve",
              "Cephalopod",
              "Fish",
              "Crustacean",
              "Gastropod",
              "Other"
            ),
            allowNull: false,
            comment: "Species category type from species_master",
          },
          unit_of_measure: {
            type: Sequelize.STRING,
            allowNull: false,
            comment:
              "Unit of measure from size_master (e.g., g, kg, cm, pcs/kg, pcs/lb)",
          },
          priority: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 1,
            comment:
              "Priority order for size recommendations (lower = higher priority)",
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment:
              "Explanation of why this size is suitable for this species type",
          },
          is_active: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
          },
          created_at: {
            defaultValue: Sequelize.fn("now"),
            type: Sequelize.DATE,
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
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
            references: {
              model: { tableName: "user_profiles" },
              key: "id",
            },
          },
          updated_by: {
            type: Sequelize.UUID,
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
            references: {
              model: { tableName: "user_profiles" },
              key: "id",
            },
          },
          deleted_by: {
            type: Sequelize.UUID,
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
            references: {
              model: { tableName: "user_profiles" },
              key: "id",
            },
          },
        });

        // Create unique constraint to prevent duplicate mappings
        try {
          await queryInterface.addConstraint("species_size_mapping", {
            fields: ["parent_category_type", "unit_of_measure"],
            type: "unique",
            name: "species_size_mapping_type_unit_unique",
            where: { is_active: true },
          });
        } catch (error) {
          // Constraint may already exist
        }

        console.log("✅ species_size_mapping table created\n");
      } else {
        // Table already exists, skip constraint creation
        // to avoid errors if columns don't match
        console.log(
          "📋 species_size_mapping table already exists, skipping creation\n"
        );
      }

      // ============================================================================
      // STEP 2: Populate initial species-size mappings
      // ============================================================================
      console.log("📋 Step 2: Populating initial species-size mappings...\n");

      // Get system user (created_by) - typically from first admin/system user
      const users = await queryInterface.sequelize.query(
        "SELECT id FROM user_profiles LIMIT 1",
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (users.length === 0) {
        console.warn(
          "⚠️  No user profiles found. Skipping data population. Please populate species_size_mapping manually after users are created."
        );
        return;
      }

      const systemUserId = users[0].id;

      // Initial species-size mappings based on industry standards
      const speciesSizeMappings = [
        // Fish - typically by weight or count
        {
          parent_category_type: "Fish",
          unit_of_measure: "g",
          priority: 1,
          description:
            "Fish typically sold by weight in grams (smaller portions or fillets)",
          created_by: systemUserId,
        },
        {
          parent_category_type: "Fish",
          unit_of_measure: "kg",
          priority: 2,
          description: "Fish sold by weight in kilograms (bulk or whole fish)",
          created_by: systemUserId,
        },
        {
          parent_category_type: "Fish",
          unit_of_measure: "pcs/kg",
          priority: 3,
          description: "Fish sold by count - pieces per kilogram",
          created_by: systemUserId,
        },
        {
          parent_category_type: "Fish",
          unit_of_measure: "pcs/lb",
          priority: 4,
          description: "Fish sold by count - pieces per pound",
          created_by: systemUserId,
        },

        // Bivalve - by shell size or count
        {
          parent_category_type: "Bivalve",
          unit_of_measure: "cm",
          priority: 1,
          description: "Bivalves measured by shell size in centimeters",
          created_by: systemUserId,
        },
        {
          parent_category_type: "Bivalve",
          unit_of_measure: "g",
          priority: 2,
          description: "Bivalves sold by weight",
          created_by: systemUserId,
        },
        {
          parent_category_type: "Bivalve",
          unit_of_measure: "kg",
          priority: 3,
          description: "Bivalves sold by bulk weight",
          created_by: systemUserId,
        },

        // Crustacean - by count or weight
        {
          parent_category_type: "Crustacean",
          unit_of_measure: "pcs/kg",
          priority: 1,
          description:
            "Crustaceans sold by count - pieces per kilogram (standard for shrimp, prawns)",
          created_by: systemUserId,
        },
        {
          parent_category_type: "Crustacean",
          unit_of_measure: "pcs/lb",
          priority: 2,
          description:
            "Crustaceans sold by count - pieces per pound (US measurement)",
          created_by: systemUserId,
        },
        {
          parent_category_type: "Crustacean",
          unit_of_measure: "kg",
          priority: 3,
          description: "Crustaceans sold by bulk weight",
          created_by: systemUserId,
        },
        {
          parent_category_type: "Crustacean",
          unit_of_measure: "g",
          priority: 4,
          description: "Crustaceans sold by weight (smaller portions)",
          created_by: systemUserId,
        },

        // Cephalopod - by weight or count
        {
          parent_category_type: "Cephalopod",
          unit_of_measure: "kg",
          priority: 1,
          description: "Cephalopods (octopus, squid) sold by weight",
          created_by: systemUserId,
        },
        {
          parent_category_type: "Cephalopod",
          unit_of_measure: "g",
          priority: 2,
          description: "Cephalopods sold by gram weight",
          created_by: systemUserId,
        },
        {
          parent_category_type: "Cephalopod",
          unit_of_measure: "pcs/kg",
          priority: 3,
          description: "Cephalopods sold by count per kilogram",
          created_by: systemUserId,
        },

        // Gastropod - by shell size or count
        {
          parent_category_type: "Gastropod",
          unit_of_measure: "cm",
          priority: 1,
          description: "Gastropods (snails) measured by shell size",
          created_by: systemUserId,
        },
        {
          parent_category_type: "Gastropod",
          unit_of_measure: "g",
          priority: 2,
          description: "Gastropods sold by weight",
          created_by: systemUserId,
        },
        {
          parent_category_type: "Gastropod",
          unit_of_measure: "kg",
          priority: 3,
          description: "Gastropods sold by bulk weight",
          created_by: systemUserId,
        },

        // Other - flexible sizing
        {
          parent_category_type: "Other",
          unit_of_measure: "g",
          priority: 1,
          description: "Generic gram measurement",
          created_by: systemUserId,
        },
        {
          parent_category_type: "Other",
          unit_of_measure: "kg",
          priority: 2,
          description: "Generic kilogram measurement",
          created_by: systemUserId,
        },
        {
          parent_category_type: "Other",
          unit_of_measure: "cm",
          priority: 3,
          description: "Generic size measurement",
          created_by: systemUserId,
        },
        {
          parent_category_type: "Other",
          unit_of_measure: "pcs/kg",
          priority: 4,
          description: "Generic count per kilogram",
          created_by: systemUserId,
        },
        {
          parent_category_type: "Other",
          unit_of_measure: "pcs/lb",
          priority: 5,
          description: "Generic count per pound",
          created_by: systemUserId,
        },
      ];

      // Insert mappings (only if table is newly created)
      if (!tableExists) {
        try {
          await queryInterface.bulkInsert(
            "species_size_mapping",
            speciesSizeMappings
          );
        } catch (error) {
          // Data may already exist
          console.warn("⚠️  Could not insert data: " + error.message);
        }
      }

      // ============================================================================
      // STEP 3: Add index for performance optimization
      // ============================================================================
      try {
        await queryInterface.addIndex("species_size_mapping", {
          fields: ["parent_category_type", "is_active"],
          name: "idx_species_size_mapping_category_active",
        });
      } catch (error) {
        // Index may already exist
      }

      try {
        await queryInterface.addIndex("species_size_mapping", {
          fields: ["unit_of_measure", "is_active"],
          name: "idx_species_size_mapping_unit_active",
        });
      } catch (error) {
        // Index may already exist
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove indexes
      await queryInterface.removeIndex(
        "species_size_mapping",
        "idx_species_size_mapping_category_active"
      );

      await queryInterface.removeIndex(
        "species_size_mapping",
        "idx_species_size_mapping_unit_active"
      );

      // Remove constraint
      await queryInterface.removeConstraint(
        "species_size_mapping",
        "species_size_mapping_type_unit_unique"
      );

      // Drop table
      await queryInterface.dropTable("species_size_mapping");
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
};
