"use strict";

/**
 * CONSOLIDATED GST MASTER MIGRATION
 *
 * This migration consolidates the following individual migrations:
 * - 20251125000003-create-consolidated-gst-master.js
 * - 20251125014306-alter-consolidated-gst-master-structure.js
 * - 20251125165106-add-gst-rate-id-and-export-gst-to-consolidated-gst-master.js
 *
 * Creates the consolidated_gst_master table with all required columns,
 * constraints, and indexes in a single migration.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create consolidated_gst_master table with all columns
    await queryInterface.createTable("consolidated_gst_master", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
      },
      company_id: { type: Sequelize.UUID, allowNull: true },
      hsn_code: Sequelize.STRING(32),
      description: Sequelize.TEXT,
      gst_rate_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: false },
      gst_type: { type: Sequelize.STRING(32), allowNull: false },
      is_export: { type: Sequelize.BOOLEAN, defaultValue: false },

      // Additional columns from alter migrations
      gst_name: { type: Sequelize.STRING(100), allowNull: true },
      cgst_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      sgst_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      igst_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      effective_from: { type: Sequelize.DATE, allowNull: true },
      effective_to: { type: Sequelize.DATE, allowNull: true },

      // Additional columns from gst-rate-id migration
      gst_rate_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true,
      },
      export_gst: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.0,
      },

      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: Sequelize.UUID,
      updated_by: Sequelize.UUID,
      deleted_by: Sequelize.UUID,
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("now") },
      updated_at: Sequelize.DATE,
      deleted_at: Sequelize.DATE,
    });

    // Add constraints
    await queryInterface.addConstraint("consolidated_gst_master", {
      fields: ["company_id", "hsn_code"],
      type: "unique",
      name: "uq_gst_company_hsn",
    });

    // Add indexes
    await queryInterface.addIndex(
      "consolidated_gst_master",
      [queryInterface.sequelize.literal("lower(hsn_code)")],
      { name: "idx_gst_hsn_lower" }
    );

    await queryInterface.addIndex(
      "consolidated_gst_master",
      [queryInterface.sequelize.literal("lower(description)")],
      {
        using: "gin",
        operator: "gin_trgm_ops",
        name: "idx_gst_desc_trgm",
      }
    );

    // Add index on gst_rate_id
    await queryInterface.addIndex("consolidated_gst_master", ["gst_rate_id"], {
      unique: true,
      where: {
        gst_rate_id: {
          [Sequelize.Op.ne]: null,
        },
      },
    });

    // Populate gst_name for existing data
    await queryInterface.sequelize.query(`
      UPDATE consolidated_gst_master
      SET
        gst_name = CASE
          WHEN gst_rate_percent = 0 THEN 'GST 0%'
          WHEN gst_rate_percent = 5 THEN 'GST 5%'
          WHEN gst_rate_percent = 12 THEN 'GST 12%'
          WHEN gst_rate_percent = 18 THEN 'GST 18%'
          WHEN gst_rate_percent = 28 THEN 'GST 28%'
          ELSE CONCAT('GST ', gst_rate_percent, '%')
        END,
        cgst_rate = CASE
          WHEN gst_type = 'INTRA' THEN gst_rate_percent / 2
          ELSE 0
        END,
        sgst_rate = CASE
          WHEN gst_type = 'INTRA' THEN gst_rate_percent / 2
          ELSE 0
        END,
        igst_rate = CASE
          WHEN gst_type = 'INTER' THEN gst_rate_percent
          ELSE 0
        END
      WHERE gst_name IS NULL
    `);
  },

  down: async (queryInterface) => {
    // Remove constraints and indexes
    try {
      await queryInterface.removeConstraint(
        "consolidated_gst_master",
        "uq_gst_company_hsn"
      );
    } catch (e) {}

    try {
      await queryInterface.removeIndex(
        "consolidated_gst_master",
        "idx_gst_hsn_lower"
      );
    } catch (e) {}

    try {
      await queryInterface.removeIndex(
        "consolidated_gst_master",
        "idx_gst_desc_trgm"
      );
    } catch (e) {}

    try {
      await queryInterface.removeIndex("consolidated_gst_master", [
        "gst_rate_id",
      ]);
    } catch (e) {}

    // Drop table
    await queryInterface.dropTable("consolidated_gst_master");
  },
};
