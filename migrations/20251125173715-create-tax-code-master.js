"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tax_code_master", {
      tax_code_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
      },
      tax_code: {
        type: Sequelize.STRING(32),
        allowNull: false,
        unique: true,
      },
      tax_code_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tax_type: {
        type: Sequelize.ENUM(
          "GST",
          "IGST",
          "NON_GST",
          "ZERO_RATED",
          "EXEMPT",
          "REVERSE_CHARGE"
        ),
        allowNull: false,
        defaultValue: "GST",
      },
      supply_type: {
        type: Sequelize.ENUM("INWARD", "OUTWARD"),
        allowNull: false,
        defaultValue: "OUTWARD",
      },
      gst_rate_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      hsn_code: {
        type: Sequelize.STRING(32),
        allowNull: true,
      },
      ledger_cgst_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      ledger_sgst_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      ledger_igst_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      is_refundable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_export_applicable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_reverse_charge: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      effective_from: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      effective_to: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      company_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      deleted_by: {
        type: Sequelize.UUID,
        allowNull: true,
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
    });

    // Add indexes for better performance
    await queryInterface.addIndex("tax_code_master", ["gst_rate_id"]);
    await queryInterface.addIndex("tax_code_master", ["company_id"]);
    await queryInterface.addIndex("tax_code_master", ["tax_code"]);
    await queryInterface.addIndex("tax_code_master", ["is_active"]);
    await queryInterface.addIndex("tax_code_master", [
      "effective_from",
      "effective_to",
    ]);

    // Add foreign keys to ledger_master
    await queryInterface
      .addConstraint("tax_code_master", {
        fields: ["ledger_cgst_id"],
        type: "foreign key",
        name: "fk_tax_ledger_cgst",
        references: {
          table: "ledger_master",
          field: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      })
      .catch(() => {}); // Ignore if exists

    await queryInterface
      .addConstraint("tax_code_master", {
        fields: ["ledger_sgst_id"],
        type: "foreign key",
        name: "fk_tax_ledger_sgst",
        references: {
          table: "ledger_master",
          field: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      })
      .catch(() => {}); // Ignore if exists

    await queryInterface
      .addConstraint("tax_code_master", {
        fields: ["ledger_igst_id"],
        type: "foreign key",
        name: "fk_tax_ledger_igst",
        references: {
          table: "ledger_master",
          field: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      })
      .catch(() => {}); // Ignore if exists

    await queryInterface
      .addConstraint("tax_code_master", {
        fields: ["ledger_input_tax_id"],
        type: "foreign key",
        name: "fk_tax_ledger_input",
        references: {
          table: "ledger_master",
          field: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      })
      .catch(() => {}); // Ignore if exists
  },

  async down(queryInterface, Sequelize) {
    // Remove foreign key constraints first
    try {
      await queryInterface.removeConstraint(
        "tax_code_master",
        "fk_tax_ledger_input"
      );
    } catch (e) {}
    try {
      await queryInterface.removeConstraint(
        "tax_code_master",
        "fk_tax_ledger_igst"
      );
    } catch (e) {}
    try {
      await queryInterface.removeConstraint(
        "tax_code_master",
        "fk_tax_ledger_sgst"
      );
    } catch (e) {}
    try {
      await queryInterface.removeConstraint(
        "tax_code_master",
        "fk_tax_ledger_cgst"
      );
    } catch (e) {}
    await queryInterface.dropTable("tax_code_master");
  },
};
