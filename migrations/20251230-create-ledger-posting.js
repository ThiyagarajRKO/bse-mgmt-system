"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create ledger_posting table
    // GL posting records for accounting entries
    // DR Debtors / CR Sales / CR GST when invoice posts
    // DR COGS / CR Inventory when goods are fulfiled
    await queryInterface.createTable("ledger_posting", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      posting_no: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      source_type: {
        type: Sequelize.ENUM(
          "INVOICE",
          "INVENTORY",
          "DISPATCH",
          "MANUAL",
          "ADJUSTMENT"
        ),
        allowNull: false,
      },
      source_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: "Reference to invoice_id, dispatch_id, etc.",
      },
      journal_header_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "journal_header",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      account_code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        references: {
          model: "chart_of_accounts",
          key: "account_code",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      debit_amount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      credit_amount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      currency_code: {
        type: Sequelize.STRING(3),
        defaultValue: "INR",
      },
      posting_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      reference_no: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "Invoice no, Order no, Batch no, etc.",
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      posting_status: {
        type: Sequelize.ENUM("DRAFT", "POSTED", "REVERSED", "CANCELLED"),
        defaultValue: "DRAFT",
      },
      reversal_posting_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "ledger_posting",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });

    // Add indexes
    await queryInterface.addIndex("ledger_posting", ["posting_no"]);
    await queryInterface.addIndex("ledger_posting", ["account_code"]);
    await queryInterface.addIndex("ledger_posting", ["posting_date"]);
    await queryInterface.addIndex("ledger_posting", ["posting_status"]);
    await queryInterface.addIndex("ledger_posting", ["source_id"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("ledger_posting");
  },
};
