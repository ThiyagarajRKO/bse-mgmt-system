"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create profitability_fact table
    await queryInterface.createTable("profitability_fact", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        allowNull: false,
      },
      invoice_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "orders", // Assuming orders table contains invoice data
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "product_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      species_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "species_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "customer_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      batch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "procurement_lots",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      sku_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      market: {
        type: Sequelize.ENUM("DOMESTIC", "EXPORT"),
        allowNull: false,
      },

      // Quantity and Revenue
      quantity_kg: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0,
      },
      net_revenue: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },

      // Cost Components
      cogs: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "Cost of Goods Sold (yield-adjusted)",
      },
      packaging_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      logistics_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "Freight and logistics cost",
      },
      yield_loss_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "Excess yield loss beyond standard",
      },
      discount_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },

      // Calculated Fields
      gross_margin: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "Net Revenue - All Costs (GST excluded)",
      },
      gross_margin_pct: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "Gross Margin % of Net Revenue",
      },

      // Metadata
      posting_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: "Date when invoice was posted",
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

    // Create indexes for performance
    await queryInterface.addIndex("profitability_fact", ["invoice_id"]);
    await queryInterface.addIndex("profitability_fact", ["product_id"]);
    await queryInterface.addIndex("profitability_fact", ["species_id"]);
    await queryInterface.addIndex("profitability_fact", ["customer_id"]);
    await queryInterface.addIndex("profitability_fact", ["batch_id"]);
    await queryInterface.addIndex("profitability_fact", ["sku_code"]);
    await queryInterface.addIndex("profitability_fact", ["market"]);
    await queryInterface.addIndex("profitability_fact", ["posting_date"]);
    await queryInterface.addIndex("profitability_fact", ["gross_margin_pct"]);

    // Create profitability_cost_breakup table
    await queryInterface.createTable("profitability_cost_breakup", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        allowNull: false,
      },
      profitability_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "profitability_fact",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      cost_type: {
        type: Sequelize.ENUM(
          "COGS",
          "PACKAGING",
          "LOGISTICS",
          "YIELD_LOSS",
          "DISCOUNT",
          "GST",
          "OTHER"
        ),
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "Optional description of the cost component",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Create indexes for cost breakup
    await queryInterface.addIndex("profitability_cost_breakup", [
      "profitability_id",
    ]);
    await queryInterface.addIndex("profitability_cost_breakup", ["cost_type"]);

    // Create profitability_alerts table for red flag tracking
    await queryInterface.createTable("profitability_alerts", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        allowNull: false,
      },
      profitability_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "profitability_fact",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      alert_type: {
        type: Sequelize.ENUM(
          "MARGIN_BELOW_MINIMUM",
          "MARGIN_DROP_WOW",
          "YIELD_LOSS_EXCESSIVE",
          "DISCOUNT_EXCEEDS_MARGIN",
          "NEGATIVE_MARGIN"
        ),
        allowNull: false,
      },
      severity: {
        type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"),
        allowNull: false,
        defaultValue: "MEDIUM",
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      threshold_value: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: true,
        comment: "The threshold that triggered the alert",
      },
      actual_value: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: true,
        comment: "The actual value that triggered the alert",
      },
      is_acknowledged: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      acknowledged_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "user_profiles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      acknowledged_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Create indexes for alerts
    await queryInterface.addIndex("profitability_alerts", ["profitability_id"]);
    await queryInterface.addIndex("profitability_alerts", ["alert_type"]);
    await queryInterface.addIndex("profitability_alerts", ["severity"]);
    await queryInterface.addIndex("profitability_alerts", ["is_acknowledged"]);
    await queryInterface.addIndex("profitability_alerts", ["created_at"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("profitability_alerts");
    await queryInterface.dropTable("profitability_cost_breakup");
    await queryInterface.dropTable("profitability_fact");
  },
};
