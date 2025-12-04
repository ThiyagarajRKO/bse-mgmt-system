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
    try {
      // ============================================================================
      // STEP 1: Create product_category_master table
      // ============================================================================
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

      // ============================================================================
      // STEP 2: Create product_master table
      // ============================================================================
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

      // ============================================================================
      // STEP 3: Create product_category_to_grade_master table
      // ============================================================================
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

      // NOTE: Data population moved to seeder
      // ============================================================================
      // Initial product categories are now populated via:
      // seeders/20251204-populate-product-categories.js
      // This allows for better control and re-seeding on new environments
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Drop tables in reverse order (respecting foreign keys)
      await queryInterface.dropTable("product_category_to_grade_master");
      await queryInterface.dropTable("product_master");
      await queryInterface.dropTable("product_category_master");
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  },
};
