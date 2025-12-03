"use strict";

/**
 * Consolidated Product Master Migration
 *
 * This migration consolidates all product master related tables and operations:
 * 1. product_category_master - Species product categories
 * 2. product_master - Individual products
 * 3. product_category_to_grade_master - Category to grade mappings
 * 4. parent_category_type column - Species taxonomy classification
 * 5. Data population - Initial category data
 *
 * Replaces:
 * - 20240328150024-create-products_category_master.js
 * - 20240328150027-create-product_master.js
 * - 20251202-add-parent-category-type-to-product-category.js
 * - 20251201120003-create-product-category-to-grade-mapping.js
 * - 20251202000000-populate-missing-product-categories.js
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log("🔄 Running consolidated product master migration...\n");

    try {
      // ============================================================================
      // STEP 1: Create product_category_master table
      // ============================================================================
      console.log("📋 Step 1: Creating product_category_master table...");

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

      console.log("✅ product_category_master table created\n");

      // ============================================================================
      // STEP 2: Create product_master table
      // ============================================================================
      console.log("📋 Step 2: Creating product_master table...");

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

      console.log("✅ product_master table created\n");

      // ============================================================================
      // STEP 3: Create product_category_to_grade_master table
      // ============================================================================
      console.log(
        "📋 Step 3: Creating product_category_to_grade_master table..."
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

      console.log("✅ product_category_to_grade_master table created\n");

      // ============================================================================
      // STEP 4: Populate initial product categories
      // ============================================================================
      console.log("📋 Step 4: Populating initial product categories...");

      // Default product categories for different species types
      const defaultCategories = [
        "Whole Fish",
        "Fillets",
        "Steaks",
        "Whole Cleaned",
        "Whole Round",
      ];

      // Get a valid user ID from the database (admin user)
      const users = await queryInterface.sequelize.query(
        `SELECT id FROM user_profiles LIMIT 1`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (!users || users.length === 0) {
        console.warn("⚠️  No users found. Skipping category population.");
        return;
      }

      const userId = users[0].id;

      // Get all species that don't have any product categories
      const speciesWithoutCategories = await queryInterface.sequelize.query(
        `SELECT s.id, s.species_name FROM species_master s
         WHERE s.id NOT IN (
           SELECT DISTINCT species_master_id FROM product_category_master 
           WHERE deleted_at IS NULL
         )
         AND s.deleted_at IS NULL`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      console.log(
        `   Found ${speciesWithoutCategories.length} species without product categories`
      );

      // Insert default categories for each species without categories
      let categoriesCreated = 0;
      for (const species of speciesWithoutCategories) {
        for (const category of defaultCategories) {
          const { v4: uuidv4 } = require("uuid");
          const categoryId = uuidv4();
          const now = new Date();

          await queryInterface.sequelize.query(
            `INSERT INTO product_category_master 
             (id, species_master_id, product_category, is_active, created_at, updated_at, created_by, parent_category_type)
             VALUES (:id, :speciesId, :category, false, :now, :now, :userId, 'Other')`,
            {
              replacements: {
                id: categoryId,
                speciesId: species.id,
                category: category,
                now: now,
                userId: userId,
              },
              type: queryInterface.sequelize.QueryTypes.INSERT,
            }
          );
          categoriesCreated++;
        }
      }

      console.log(
        `✅ Created ${categoriesCreated} initial product categories\n`
      );

      console.log("=".repeat(70));
      console.log(
        "✅ CONSOLIDATION COMPLETE - All product master tables created"
      );
      console.log("=".repeat(70));
      console.log("\nSummary:");
      console.log("  ✅ product_category_master table");
      console.log("  ✅ product_master table");
      console.log("  ✅ product_category_to_grade_master table");
      console.log("  ✅ parent_category_type column");
      console.log(`  ✅ ${categoriesCreated} initial categories populated\n`);
    } catch (error) {
      console.error("❌ Error during migration:", error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log("⏮️  Rolling back consolidated product master migration...\n");

    try {
      // Drop tables in reverse order (respecting foreign keys)
      console.log("Dropping product_category_to_grade_master...");
      await queryInterface.dropTable("product_category_to_grade_master");

      console.log("Dropping product_master...");
      await queryInterface.dropTable("product_master");

      console.log("Dropping product_category_master...");
      await queryInterface.dropTable("product_category_master");

      console.log("\n✅ Rollback complete\n");
    } catch (error) {
      console.error("❌ Error during rollback:", error.message);
      throw error;
    }
  },
};
