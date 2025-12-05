"use strict";

/**
 * Consolidated Species & Product Master Migration
 *
 * This migration consolidates all species, product, grade, size, and mapping related tables:
 *
 * CORE TABLES:
 * 1. species_master - Species/seafood definitions
 * 2. grade_master - Product quality grades
 * 3. size_master - Available size measurements
 * 4. product_category_master - Species product categories
 * 5. product_master - Individual products
 *
 * MAPPING TABLES:
 * 6. grade_size_mapping - Grade to size relationships
 * 7. species_size_mapping - Species to size suitability mappings
 * 8. product_category_to_grade_master - Product category to grade mappings
 *
 * CONSOLIDATED FROM:
 * - 20240328150008-create-grade_master.js
 * - 20240328150012-create-size_master.js
 * - 20240328150019-create-species_master.js
 * - 20240328150024-create-products_category_master.js
 * - 20240328150027-create-product_master.js
 * - 20251201120002-create-grade-size-mapping.js
 * - 20251202-consolidated-product-master.js
 * - 20251202-create-species-size-mapping.js
 * - Plus parent_category_type enhancements
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if tables already exist (for idempotency)
      const tables = await queryInterface.showAllTables();

      // Only create tables that don't already exist
      if (!tables.includes("grade_master")) {
        // ============================================================================
        // STEP 1: Create grade_master table (if not exists)
        // ============================================================================
        console.log("[Migration] Creating grade_master table...");
        await queryInterface.createTable("grade_master", {
          id: {
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
          },
          grade_name: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          description: {
            type: Sequelize.TEXT,
          },
          is_active: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
          },
          updated_at: {
            type: Sequelize.DATE,
          },
          created_by: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: { tableName: "user_profiles" },
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
          updated_by: {
            type: Sequelize.UUID,
            references: {
              model: { tableName: "user_profiles" },
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
        });
      }

      if (!tables.includes("size_master")) {
        // ============================================================================
        // STEP 2: Create size_master table (if not exists)
        // ============================================================================
        console.log("[Migration] Creating size_master table...");
        await queryInterface.createTable("size_master", {
          id: {
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
          },
          size: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          unit_of_measure: {
            type: Sequelize.STRING,
          },
          description: {
            type: Sequelize.TEXT,
          },
          is_active: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
          },
          updated_at: {
            type: Sequelize.DATE,
          },
          created_by: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: { tableName: "user_profiles" },
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
          updated_by: {
            type: Sequelize.UUID,
            references: {
              model: { tableName: "user_profiles" },
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
        });
      }

      if (!tables.includes("grade_size_mapping")) {
        // ============================================================================
        // STEP 3: Create grade_size_mapping table (if not exists)
        // ============================================================================
        console.log("[Migration] Creating grade_size_mapping table...");
        await queryInterface.createTable("grade_size_mapping", {
          id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
          },
          grade_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: "grade_master",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
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
          },
          created_at: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
          },
          updated_at: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
          },
        });
      }

      if (!tables.includes("species_size_mapping")) {
        // ============================================================================
        // STEP 4: Create species_size_mapping table (if not exists)
        // ============================================================================
        console.log("[Migration] Creating species_size_mapping table...");
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
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
          },
          updated_at: {
            type: Sequelize.DATE,
          },
        });

        // Add unique constraint
        await queryInterface.addConstraint("species_size_mapping", {
          fields: ["parent_category_type", "size_id"],
          type: "unique",
          name: "unique_species_type_size_combination",
        });
      }

      if (!tables.includes("product_category_master")) {
        // ============================================================================
        // STEP 5: Create product_category_master table (if not exists)
        // ============================================================================
        console.log("[Migration] Creating product_category_master table...");
        await queryInterface.createTable("product_category_master", {
          id: {
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
          },
          species_master_id: {
            type: Sequelize.UUID,
            allowNull: false,
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
            references: {
              model: { tableName: "species_master" },
              key: "id",
            },
          },
          product_category: {
            type: Sequelize.STRING,
            allowNull: false,
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
            allowNull: true,
            comment: "Parent category type inherited from species_master",
          },
          is_active: {
            defaultValue: false,
            type: Sequelize.BOOLEAN,
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
      }

      if (!tables.includes("product_category_to_grade_master")) {
        // ============================================================================
        // STEP 6: Create product_category_to_grade_master table (if not exists)
        // ============================================================================
        console.log(
          "[Migration] Creating product_category_to_grade_master table..."
        );
        await queryInterface.createTable("product_category_to_grade_master", {
          id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
          },
          product_category_master_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: "product_category_master",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          grade_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: "grade_master",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          created_at: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
          },
          updated_at: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
          },
        });

        // Add composite unique constraint
        await queryInterface.addConstraint("product_category_to_grade_master", {
          fields: ["product_category_master_id", "grade_id"],
          type: "unique",
          name: "unique_category_grade_combination",
        });
      }

      if (!tables.includes("product_master")) {
        // ============================================================================
        // STEP 7: Create product_master table (if not exists)
        // ============================================================================
        console.log("[Migration] Creating product_master table...");
        await queryInterface.createTable("product_master", {
          id: {
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
          },
          product_name: {
            type: Sequelize.TEXT,
            allowNull: false,
            unique: true,
          },
          product_category_master_id: {
            type: Sequelize.UUID,
            allowNull: false,
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
            references: {
              model: { tableName: "product_category_master" },
              key: "id",
            },
          },
          size_master_id: {
            type: Sequelize.UUID,
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
            references: {
              model: { tableName: "size_master" },
              key: "id",
            },
          },
          is_active: {
            defaultValue: false,
            type: Sequelize.BOOLEAN,
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
      }

      console.log(
        "[Migration] ✅ All consolidated species/product tables created successfully!"
      );
    } catch (error) {
      console.error("[Migration] ❌ Error:", error.message);
      throw error;
    }
  },

  down: async (queryInterface) => {
    try {
      // Drop in reverse order (respecting foreign keys)
      console.log(
        "[Migration] Rolling back consolidated species/product tables..."
      );

      const tables = await queryInterface.showAllTables();

      // Drop in reverse dependency order
      if (tables.includes("product_master")) {
        await queryInterface.dropTable("product_master");
      }
      if (tables.includes("product_category_to_grade_master")) {
        await queryInterface.dropTable("product_category_to_grade_master");
      }
      if (tables.includes("product_category_master")) {
        await queryInterface.dropTable("product_category_master");
      }
      if (tables.includes("species_size_mapping")) {
        await queryInterface.dropTable("species_size_mapping");
      }
      if (tables.includes("grade_size_mapping")) {
        await queryInterface.dropTable("grade_size_mapping");
      }
      if (tables.includes("size_master")) {
        await queryInterface.dropTable("size_master");
      }
      if (tables.includes("grade_master")) {
        await queryInterface.dropTable("grade_master");
      }

      console.log("[Migration] ✅ Rollback completed!");
    } catch (error) {
      console.error("[Migration] ❌ Rollback error:", error.message);
      throw error;
    }
  },
};
