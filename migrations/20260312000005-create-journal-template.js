"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("journal_template", {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      event_type: {
        type: Sequelize.ENUM(
          "PURCHASE_GRN",
          "SUPPLIER_PAYMENT",
          "RAW_ISSUE_TO_PRODUCTION",
          "PRODUCTION_COMPLETION",
          "BYPRODUCT_CREATION",
          "PACKAGING_CONSUMPTION",
          "PACKING_COMPLETION",
          "INTERNAL_TRANSFER",
          "TRANSFER_RECEIPT",
          "DISPATCH",
          "SALES_INVOICE",
          "SALES_TAX",
          "CUSTOMER_PAYMENT",
        ),
        allowNull: false,
        unique: true,
      },
      event_description: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      debit_account_id: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "chart_of_accounts" },
          key: "id",
        },
      },
      debit_account_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      credit_account_id: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "chart_of_accounts" },
          key: "id",
        },
      },
      credit_account_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      auto_post: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: "Whether journal entry should be automatically posted",
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
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
    });

    await queryInterface.addIndex("journal_template", ["event_type"]);
    await queryInterface.addIndex("journal_template", ["is_active"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("journal_template");
  },
};
