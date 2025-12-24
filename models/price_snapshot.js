"use strict";
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PriceSnapshot = sequelize.define(
    "PriceSnapshot",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      batch_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "procurement_lots",
          key: "id",
        },
      },
      species_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "species_master",
          key: "id",
        },
      },
      product_form: {
        type: DataTypes.ENUM("FROZEN", "COOKED", "RTE", "FRESH"),
        allowNull: false,
      },
      market: {
        type: DataTypes.ENUM("DOMESTIC", "EXPORT", "RETAIL", "WHOLESALE"),
        allowNull: false,
      },
      // Raw cost inputs
      raw_cost_per_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      processing_cost_per_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      yield_loss_cost_per_kg: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      // Yield data
      expected_yield_pct: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      actual_yield_pct: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      yield_variance_pct: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      // Calculated prices
      effective_cost_per_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      target_margin_pct: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      calculated_price_ex_gst: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      gst_rate_pct: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      calculated_price_inc_gst: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      // Override information
      is_override: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      override_reason: {
        type: DataTypes.ENUM(
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
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      override_approved_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      override_approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Status and approval
      status: {
        type: DataTypes.ENUM("CALCULATED", "APPROVED", "REJECTED", "EXPIRED"),
        defaultValue: "CALCULATED",
      },
      approved_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejected_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      rejected_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Audit fields
      calculation_metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: "price_snapshot",
      timestamps: true,
      paranoid: false,
      indexes: [
        {
          fields: ["batch_id"],
        },
        {
          fields: ["species_id"],
        },
        {
          fields: ["status"],
        },
        {
          fields: ["approved_at"],
        },
        {
          fields: ["created_at"],
        },
      ],
    }
  );

  PriceSnapshot.associate = (models) => {
    PriceSnapshot.belongsTo(models.ProcurementLots, {
      foreignKey: "batch_id",
      as: "batch",
    });
    PriceSnapshot.belongsTo(models.SpeciesMaster, {
      foreignKey: "species_id",
      as: "species",
    });
  };

  return PriceSnapshot;
};
