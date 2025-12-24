"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create margin_master table
    await queryInterface.createTable("margin_master", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
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
      product_form: {
        type: Sequelize.ENUM("FROZEN", "COOKED", "RTE", "FRESH"),
        allowNull: false,
      },
      market: {
        type: Sequelize.ENUM("DOMESTIC", "EXPORT", "RETAIL", "WHOLESALE"),
        allowNull: false,
      },
      target_margin_pct: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        validate: {
          min: 0,
          max: 100,
        },
      },
      min_margin_pct: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        validate: {
          min: 0,
          max: 100,
        },
      },
      yield_tolerance_pct: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 5.0,
        comment: "Yield variance tolerance before price adjustment",
      },
      auto_uplift_pct: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 10.0,
        comment: "Automatic price uplift for yield breaches",
      },
      approval_required_pct: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 15.0,
        comment: "Yield variance requiring approval",
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      effective_from: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      effective_to: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      updated_by: {
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
    });

    // Create processing_cost_master table
    await queryInterface.createTable("processing_cost_master", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
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
      process_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: "PUD, Cleaned, Cooked meat, etc.",
      },
      cost_per_kg: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      currency_code: {
        type: Sequelize.STRING(3),
        defaultValue: "INR",
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      effective_from: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      effective_to: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      updated_by: {
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
    });

    // Create price_snapshot table
    await queryInterface.createTable("price_snapshot", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      batch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "procurement_lots",
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
      },
      product_form: {
        type: Sequelize.ENUM("FROZEN", "COOKED", "RTE", "FRESH"),
        allowNull: false,
      },
      market: {
        type: Sequelize.ENUM("DOMESTIC", "EXPORT", "RETAIL", "WHOLESALE"),
        allowNull: false,
      },
      // Raw cost inputs
      raw_cost_per_kg: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      processing_cost_per_kg: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      yield_loss_cost_per_kg: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      // Yield data
      expected_yield_pct: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      actual_yield_pct: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      yield_variance_pct: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      // Calculated prices
      effective_cost_per_kg: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      target_margin_pct: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      calculated_price_ex_gst: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      gst_rate_pct: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      calculated_price_inc_gst: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      // Override information
      is_override: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      override_reason: {
        type: Sequelize.ENUM(
          "MARKET_DROP",
          "LONG_TERM_CUSTOMER",
          "CLEARANCE",
          "QUALITY_DOWNGRADE",
          "YIELD_IMPACT",
          "COST_INCREASE"
        ),
        allowNull: true,
      },
      override_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      override_approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      override_approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      // Status and approval
      status: {
        type: Sequelize.ENUM("CALCULATED", "APPROVED", "REJECTED", "EXPIRED"),
        defaultValue: "CALCULATED",
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      rejected_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      rejected_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      // Audit fields
      calculation_metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: "Additional calculation details and parameters",
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
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add indexes for performance
    await queryInterface.addIndex("margin_master", [
      "species_id",
      "product_form",
      "market",
    ]);
    await queryInterface.addIndex("margin_master", [
      "is_active",
      "effective_from",
      "effective_to",
    ]);
    await queryInterface.addIndex("processing_cost_master", [
      "species_id",
      "process_type",
    ]);
    await queryInterface.addIndex("processing_cost_master", [
      "is_active",
      "effective_from",
      "effective_to",
    ]);
    await queryInterface.addIndex("price_snapshot", ["batch_id"]);
    await queryInterface.addIndex("price_snapshot", ["species_id"]);
    await queryInterface.addIndex("price_snapshot", ["status"]);
    await queryInterface.addIndex("price_snapshot", ["approved_at"]);
    await queryInterface.addIndex("price_snapshot", ["created_at"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("price_snapshot");
    await queryInterface.dropTable("processing_cost_master");
    await queryInterface.dropTable("margin_master");
  },
};
