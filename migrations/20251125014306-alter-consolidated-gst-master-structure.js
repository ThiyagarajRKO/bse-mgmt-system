"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new columns
    await queryInterface.addColumn("consolidated_gst_master", "gst_name", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn("consolidated_gst_master", "cgst_rate", {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0.0,
    });

    await queryInterface.addColumn("consolidated_gst_master", "sgst_rate", {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0.0,
    });

    await queryInterface.addColumn("consolidated_gst_master", "igst_rate", {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0.0,
    });

    await queryInterface.addColumn(
      "consolidated_gst_master",
      "effective_from",
      {
        type: Sequelize.DATE,
        allowNull: true,
      }
    );

    await queryInterface.addColumn("consolidated_gst_master", "effective_to", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Update existing data to populate new fields
    await queryInterface.sequelize.query(`
      UPDATE consolidated_gst_master
      SET
        gst_name = CASE
          WHEN gst_rate_percent = 0 THEN 'GST 0%'
          WHEN gst_rate_percent = 5 THEN 'GST 5%'
          WHEN gst_rate_percent = 12 THEN 'GST 12%'
          WHEN gst_rate_percent = 18 THEN 'GST 18%'
          ELSE CONCAT('GST ', gst_rate_percent, '%')
        END,
        cgst_rate = CASE
          WHEN gst_rate_percent = 0 THEN 0.00
          ELSE gst_rate_percent / 2
        END,
        sgst_rate = CASE
          WHEN gst_rate_percent = 0 THEN 0.00
          ELSE gst_rate_percent / 2
        END,
        igst_rate = gst_rate_percent,
        effective_from = '2024-04-01'::date,
        effective_to = NULL
      WHERE gst_name IS NULL
    `);

    // Make gst_name NOT NULL after populating data
    await queryInterface.changeColumn("consolidated_gst_master", "gst_name", {
      type: Sequelize.STRING(100),
      allowNull: false,
    });

    // Remove old columns
    await queryInterface.removeColumn(
      "consolidated_gst_master",
      "gst_rate_percent"
    );
    await queryInterface.removeColumn("consolidated_gst_master", "gst_type");
    await queryInterface.removeColumn("consolidated_gst_master", "is_export");

    // Update unique constraint to include gst_name
    try {
      await queryInterface.removeConstraint(
        "consolidated_gst_master",
        "uq_gst_company_hsn"
      );
    } catch (e) {
      // Constraint doesn't exist, continue
    }

    await queryInterface.addConstraint("consolidated_gst_master", {
      fields: ["company_id", "hsn_code"],
      type: "unique",
      name: "uq_gst_company_hsn",
    });

    // Add index on gst_name
    await queryInterface.addIndex("consolidated_gst_master", ["gst_name"], {
      name: "idx_gst_name",
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert changes - add back old columns
    await queryInterface.addColumn(
      "consolidated_gst_master",
      "gst_rate_percent",
      {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      }
    );

    await queryInterface.addColumn("consolidated_gst_master", "gst_type", {
      type: Sequelize.STRING(32),
      allowNull: false,
    });

    await queryInterface.addColumn("consolidated_gst_master", "is_export", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    // Populate old columns from new data
    await queryInterface.sequelize.query(`
      UPDATE consolidated_gst_master
      SET
        gst_rate_percent = igst_rate,
        gst_type = 'Goods',
        is_export = false
      WHERE gst_rate_percent IS NULL
    `);

    // Remove new columns
    await queryInterface.removeColumn("consolidated_gst_master", "gst_name");
    await queryInterface.removeColumn("consolidated_gst_master", "cgst_rate");
    await queryInterface.removeColumn("consolidated_gst_master", "sgst_rate");
    await queryInterface.removeColumn("consolidated_gst_master", "igst_rate");
    await queryInterface.removeColumn(
      "consolidated_gst_master",
      "effective_from"
    );
    await queryInterface.removeColumn(
      "consolidated_gst_master",
      "effective_to"
    );

    // Remove index
    try {
      await queryInterface.removeIndex(
        "consolidated_gst_master",
        "idx_gst_name"
      );
    } catch (e) {
      // Index doesn't exist
    }

    // Restore original constraint
    try {
      await queryInterface.removeConstraint(
        "consolidated_gst_master",
        "uq_gst_company_hsn"
      );
    } catch (e) {
      // Constraint doesn't exist
    }

    await queryInterface.addConstraint("consolidated_gst_master", {
      fields: ["company_id", "hsn_code"],
      type: "unique",
      name: "uq_gst_company_hsn",
    });
  },
};
