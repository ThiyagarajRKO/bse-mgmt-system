"use strict";
const { DataTypes } = require("sequelize");

/**
 * Production Variance - Yield loss tracking & GL posting
 *
 * Types:
 *   NORMAL_LOSS → Absorbed (no GL entry, just analytics)
 *   ABNORMAL_LOSS → Posted to GL (YIELD_VARIANCE_EXPENSE)
 *   GRADE_VARIANCE → Downgrade absorption (cost of quality)
 *   SIZE_VARIANCE → Size tolerance variance
 *
 * Row: PRODUCTION_ORDER | DERIVATIVE | PLANNED_QTY | ACTUAL_QTY | VARIANCE_QTY | VARIANCE_REASON
 */
module.exports = (sequelize) => {
  const ProductionVariance = sequelize.define(
    "production_variance",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      production_order_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "production_orders", key: "id" },
      },
      derivative_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Which derivative this variance belongs to",
      },
      planned_qty_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      actual_qty_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      variance_qty_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: "actual - planned (negative=loss, positive=gain)",
      },
      variance_percent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        comment: "variance_qty / planned_qty × 100",
      },
      variance_type: {
        type: DataTypes.ENUM(
          "NORMAL_LOSS",
          "ABNORMAL_LOSS",
          "GRADE_VARIANCE",
          "SIZE_VARIANCE",
          "QUALITY_LOSS",
        ),
        allowNull: false,
        defaultValue: "NORMAL_LOSS",
      },
      variance_reason: {
        type: DataTypes.TEXT,
        comment: "Why did variance occur? (Operator notes)",
      },
      variance_cost: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: true,
        comment: "Cost of variance (variance_qty × cost_per_unit)",
      },
      gl_posted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Only ABNORMAL_LOSS posts to GL",
      },
      gl_entry_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      created_by: DataTypes.UUID,
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "production_variance",
      timestamps: false,
      underscored: true,
      indexes: [
        { fields: ["production_order_id"] },
        { fields: ["variance_type"] },
        { fields: ["gl_posted"] },
      ],
    },
  );

  ProductionVariance.associate = (models) => {
    if (models.ProductionOrder) {
      ProductionVariance.belongsTo(models.ProductionOrder, {
        foreignKey: "production_order_id",
      });
    }
    if (models.DerivativeMaster) {
      ProductionVariance.belongsTo(models.DerivativeMaster, {
        foreignKey: "derivative_id",
      });
    }
  };

  return ProductionVariance;
};
