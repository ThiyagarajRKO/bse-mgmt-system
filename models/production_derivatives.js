"use strict";
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductionDerivative = sequelize.define(
    "production_derivatives",
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
      derivative_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      planned_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        comment:
          "Percentage of issued quantity allocated to this derivative. Must sum to 100% across all derivatives.",
      },
      theoretical_yield_percent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        comment: "From YieldMaster lookup by species-derivative-grade",
      },
      expected_quantity_kg: {
        type: DataTypes.DECIMAL(10, 2),
        comment:
          "issued_quantity_kg × planned_percentage × (theoretical_yield_percent / 100)",
      },
      is_auto_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment:
          "True for MINCE/TRIM when enabled due to yield loss. System can auto-create this line.",
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      tableName: "production_derivatives",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["production_order_id"],
        },
        {
          fields: ["derivative_id"],
        },
        {
          unique: true,
          fields: ["production_order_id", "derivative_id"],
          name: "uk_prod_deriv",
        },
      ],
    },
  );

  ProductionDerivative.associate = (models) => {
    if (models.ProductionOrder) {
      ProductionDerivative.belongsTo(models.ProductionOrder, {
        foreignKey: "production_order_id",
        as: "production_order",
      });
    }
    if (models.DerivativeMaster) {
      ProductionDerivative.belongsTo(models.DerivativeMaster, {
        foreignKey: "derivative_id",
        as: "derivative",
      });
    }
    if (models.ProductionOutput) {
      ProductionDerivative.hasMany(models.ProductionOutput, {
        foreignKey: "production_derivative_id",
        as: "outputs",
        onDelete: "CASCADE",
      });
    }
  };

  return ProductionDerivative;
};
