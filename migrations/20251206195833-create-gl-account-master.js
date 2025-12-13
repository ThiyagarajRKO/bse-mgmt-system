"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("gl_account_master", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
      },
      company_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      account_code: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      account_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      account_type: {
        type: Sequelize.ENUM(
          "Asset",
          "Liability",
          "Income",
          "Expense",
          "Equity"
        ),
        allowNull: false,
      },
      account_group: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      parent_account_code: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      is_posting_account: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      is_tax_ledger: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      gst_component: {
        type: Sequelize.STRING(10),
        allowNull: true,
        validate: {
          isIn: [["CGST", "SGST", "IGST"]],
        },
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add indexes
    await queryInterface.addIndex("gl_account_master", ["account_code"]);
    await queryInterface.addIndex("gl_account_master", ["account_type"]);
    await queryInterface.addIndex("gl_account_master", ["parent_account_code"]);
    await queryInterface.addIndex("gl_account_master", ["company_id"]);
    await queryInterface.addIndex("gl_account_master", ["is_active"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("gl_account_master");
  },
};
