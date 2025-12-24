"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if chart_of_accounts table exists and add missing columns
    const coaExists = await queryInterface.sequelize.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chart_of_accounts');"
    );

    if (coaExists[0][0].exists) {
      // Add missing columns to existing chart_of_accounts table
      const columnsToAdd = [
        {
          name: "account_category",
          type: Sequelize.ENUM(
            "CURRENT_ASSET",
            "FIXED_ASSET",
            "CURRENT_LIABILITY",
            "LONG_TERM_LIABILITY",
            "EQUITY",
            "OPERATING_REVENUE",
            "OTHER_REVENUE",
            "COST_OF_SALES",
            "OPERATING_EXPENSE",
            "OTHER_EXPENSE"
          ),
        },
        { name: "parent_account_code", type: Sequelize.STRING(20) },
        { name: "is_control_account", type: Sequelize.BOOLEAN, default: false },
        { name: "is_postable", type: Sequelize.BOOLEAN, default: true },
        { name: "currency_code", type: Sequelize.STRING(3), default: "INR" },
        {
          name: "opening_balance",
          type: Sequelize.DECIMAL(15, 2),
          default: 0.0,
        },
        {
          name: "current_balance",
          type: Sequelize.DECIMAL(15, 2),
          default: 0.0,
        },
      ];

      for (const col of columnsToAdd) {
        const columnExists = await queryInterface.sequelize.query(
          `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chart_of_accounts' AND column_name = '${col.name}');`
        );
        if (!columnExists[0][0].exists) {
          await queryInterface.addColumn("chart_of_accounts", col.name, {
            type: col.type,
            allowNull: true,
            defaultValue: col.default,
          });
        }
      }
    } else {
      // Create chart_of_accounts table if it doesn't exist
      await queryInterface.createTable("chart_of_accounts", {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false,
        },
        account_code: {
          type: Sequelize.STRING(20),
          allowNull: false,
          unique: true,
        },
        account_name: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        account_type: {
          type: Sequelize.ENUM(
            "ASSET",
            "LIABILITY",
            "EQUITY",
            "REVENUE",
            "EXPENSE"
          ),
          allowNull: false,
        },
        account_category: {
          type: Sequelize.ENUM(
            "CURRENT_ASSET",
            "FIXED_ASSET",
            "CURRENT_LIABILITY",
            "LONG_TERM_LIABILITY",
            "EQUITY",
            "OPERATING_REVENUE",
            "OTHER_REVENUE",
            "COST_OF_SALES",
            "OPERATING_EXPENSE",
            "OTHER_EXPENSE"
          ),
          allowNull: true,
        },
        parent_account_code: {
          type: Sequelize.STRING(20),
          allowNull: true,
        },
        is_control_account: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        is_postable: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        currency_code: {
          type: Sequelize.STRING(3),
          defaultValue: "INR",
        },
        opening_balance: {
          type: Sequelize.DECIMAL(15, 2),
          defaultValue: 0.0,
        },
        current_balance: {
          type: Sequelize.DECIMAL(15, 2),
          defaultValue: 0.0,
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
    }

    // Create posting_rule_master table
    await queryInterface.createTable("posting_rule_master", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      event_code: {
        type: Sequelize.ENUM(
          "GRN",
          "PROD_ISSUE",
          "FG_RECEIPT",
          "SALES_INVOICE",
          "CREDIT_NOTE",
          "STOCK_ADJUST",
          "YIELD_LOSS",
          "GST_POSTING"
        ),
        allowNull: false,
      },
      rule_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      rule_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      debit_account_code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: "Account code for debit entry",
      },
      credit_account_code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: "Account code for credit entry",
      },
      rule_condition: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment:
          'JSON conditions for rule application (e.g., {"supply_type": "DOMESTIC"})',
      },
      priority: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: "Rule priority for multiple matching rules",
      },
      is_system_rule: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: "System rules cannot be deleted",
      },
      requires_approval: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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

    // Create journal_header table
    await queryInterface.createTable("journal_header", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      journal_no: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true,
      },
      journal_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      posting_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      source_module: {
        type: Sequelize.ENUM(
          "INVENTORY",
          "SALES",
          "PURCHASE",
          "PRODUCTION",
          "GST",
          "YIELD",
          "MANUAL"
        ),
        allowNull: false,
      },
      source_document_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "GRN, Invoice, etc.",
      },
      source_document_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: "Reference to source document",
      },
      source_document_no: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "Human readable document number",
      },
      event_code: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      total_debit: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      total_credit: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      currency_code: {
        type: Sequelize.STRING(3),
        defaultValue: "INR",
      },
      exchange_rate: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 1.0,
      },
      status: {
        type: Sequelize.ENUM("DRAFT", "POSTED", "REVERSED", "ERROR"),
        allowNull: false,
        defaultValue: "DRAFT",
      },
      posted_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      posted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      reversed_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      reversed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      reversal_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_system_generated: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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

    // Create journal_lines table
    await queryInterface.createTable("journal_lines", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      journal_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "journal_header",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      line_no: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      account_code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: "Chart of accounts code",
      },
      account_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      debit_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      credit_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      line_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      reference_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "Customer, Supplier, Product, etc.",
      },
      reference_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: "Reference to customer, supplier, etc.",
      },
      cost_center: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      tax_code: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      tax_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      tax_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
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
    });

    // Create posting_audit_log table
    await queryInterface.createTable("posting_audit_log", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      event_code: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      source_module: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      source_document_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      source_document_no: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      journal_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "journal_header",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      posting_rule_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "posting_rule_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      transaction_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: "Original transaction data for audit",
      },
      posting_result: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: "Posting result or error details",
      },
      status: {
        type: Sequelize.ENUM("SUCCESS", "FAILED", "PENDING", "REVERSED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      posted_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      posted_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
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
    });

    // Create indexes
    await queryInterface.addIndex("chart_of_accounts", ["account_code"]);
    await queryInterface.addIndex("chart_of_accounts", ["account_type"]);
    await queryInterface.addIndex("chart_of_accounts", ["is_active"]);

    await queryInterface.addIndex("posting_rule_master", ["event_code"]);
    await queryInterface.addIndex("posting_rule_master", [
      "debit_account_code",
    ]);
    await queryInterface.addIndex("posting_rule_master", [
      "credit_account_code",
    ]);
    await queryInterface.addIndex("posting_rule_master", ["is_active"]);

    await queryInterface.addIndex("journal_header", ["journal_no"]);
    await queryInterface.addIndex("journal_header", ["source_document_id"]);
    await queryInterface.addIndex("journal_header", ["status"]);
    await queryInterface.addIndex("journal_header", ["posting_date"]);

    await queryInterface.addIndex("journal_lines", ["journal_id"]);
    await queryInterface.addIndex("journal_lines", ["account_code"]);

    await queryInterface.addIndex("posting_audit_log", ["event_code"]);
    await queryInterface.addIndex("posting_audit_log", ["source_document_id"]);
    await queryInterface.addIndex("posting_audit_log", ["status"]);
    await queryInterface.addIndex("posting_audit_log", ["posted_at"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("posting_audit_log");
    await queryInterface.dropTable("journal_lines");
    await queryInterface.dropTable("journal_header");
    await queryInterface.dropTable("posting_rule_master");
    await queryInterface.dropTable("chart_of_accounts");
  },
};
