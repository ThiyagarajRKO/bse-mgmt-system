"use strict";

/**
 * Consolidated Size Master Migration
 * Combines:
 * - 20240328150012-create-size_master.js (Create size_master table)
 * - 20251201000000-add-unit-of-measure-to-size-master.js (Add unit_of_measure column)
 * - 20251201120000-add-unit-of-measure-to-size-master.js (Add unit_of_measure column with different config)
 * - 20251201120001-add-size-id-to-size-master.js (Add size_id column)
 * - 20251201120002-create-grade-size-mapping.js (Create grade_size_mapping table)
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Step 1: Create size_master table (if it doesn't exist)
    const sizeMasterExists = await queryInterface.tableExists("size_master");
    if (!sizeMasterExists) {
      await queryInterface.createTable("size_master", {
        id: {
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
        },
        size: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        size_id: {
          type: Sequelize.STRING(50),
          allowNull: true,
          unique: false,
          comment: "Size identifier code (e.g., SZ001, SZ002, etc.)",
        },
        unit_of_measure: {
          type: Sequelize.STRING(50),
          allowNull: true,
          defaultValue: null,
          comment: "Unit of measurement for size (cm, g, kg, pcs/kg, pcs/lb)",
        },
        description: {
          type: Sequelize.TEXT,
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

    // Step 2: Create grade_size_mapping table (if it doesn't exist)
    const gradeSizeMappingExists = await queryInterface.tableExists(
      "grade_size_mapping"
    );
    if (!gradeSizeMappingExists) {
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

      // Add composite unique constraint (if it doesn't exist)
      try {
        await queryInterface.addConstraint("grade_size_mapping", {
          fields: ["grade_id", "size_id"],
          type: "unique",
          name: "unique_grade_size_combination",
        });
      } catch (error) {
        // Ignore if constraint already exists
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order
    await queryInterface.dropTable("grade_size_mapping");
    await queryInterface.dropTable("size_master");
  },
};
