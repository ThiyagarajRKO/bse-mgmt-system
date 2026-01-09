"use strict";
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductionOutput = sequelize.define(
    "production_outputs",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      production_order_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      production_derivative_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      derivative_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.UUID,
        comment: "Foreign key to auto-generated SKU product_master record",
      },
      actual_quantity_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      actual_grade: {
        type: DataTypes.ENUM("A", "B", "C", "D"),
        allowNull: false,
        comment:
          "HARD RULE: Can only downgrade from initial_grade. Upgrade is blocked.",
      },
      size_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: "Must exist in size_master. Immutable from raw issue.",
      },
      expected_quantity_kg: {
        type: DataTypes.DECIMAL(10, 2),
        comment: "From production_derivatives.expected_quantity_kg",
      },
      actual_yield_percent: {
        type: DataTypes.DECIMAL(5, 2),
        comment: "actual_quantity_kg / expected_quantity_kg × 100",
      },
      cost_allocated: {
        type: DataTypes.DECIMAL(12, 2),
        comment:
          "Raw cost + processing + packaging allocated to this output line",
      },
      sku_code: {
        type: DataTypes.STRING(100),
        comment: "Auto-generated: species-derivative-grade-size-pack",
      },
      inventory_posted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment:
          "FG inventory created. HARD RULE: Must be true before invoice generation.",
      },
      gl_posted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment:
          "GL entries created (Dr FG, Cr RM). 2-phase posting with inventory_posted.",
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      tableName: "production_outputs",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["production_order_id"],
        },
        {
          fields: ["product_id"],
        },
        {
          fields: ["sku_code"],
        },
      ],
    }
  );

  ProductionOutput.associate = (models) => {
    ProductionOutput.belongsTo(models.production_orders, {
      foreignKey: "production_order_id",
      as: "production_order",
    });
    ProductionOutput.belongsTo(models.production_derivatives, {
      foreignKey: "production_derivative_id",
      as: "production_derivative",
    });
    ProductionOutput.belongsTo(models.derivative_master, {
      foreignKey: "derivative_id",
      as: "derivative",
    });
    ProductionOutput.belongsTo(models.product_master, {
      foreignKey: "product_id",
      as: "sku_product",
    });
  };

  return ProductionOutput;
};
