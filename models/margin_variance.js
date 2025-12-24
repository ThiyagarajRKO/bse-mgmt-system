"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class MarginVariance extends Model {
    static associate(models) {
      // Define associations
      MarginVariance.belongsTo(models.Invoice, {
        foreignKey: "invoice_id",
        as: "invoice",
      });
      MarginVariance.belongsTo(models.YieldActual, {
        foreignKey: "yield_actual_id",
        as: "yieldActual",
      });
    }
  }

  MarginVariance.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      invoice_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "invoice",
          key: "id",
        },
      },
      yield_actual_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "yield_actual",
          key: "id",
        },
      },
      sale_quantity_kg: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
      },
      standard_cost_per_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      actual_cost_per_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      margin_variance_value: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      reason_codes: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      accounting_treatment: {
        type: DataTypes.ENUM(
          "NORMAL_LOSS",
          "EXCESS_LOSS_EXPENSE",
          "MARGIN_OFFSET"
        ),
        allowNull: false,
        defaultValue: "NORMAL_LOSS",
      },
      gl_posted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      gl_entry_id: {
        type: DataTypes.UUID,
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
      sequelize,
      modelName: "MarginVariance",
      tableName: "margin_variance",
      timestamps: true,
      paranoid: false,
    }
  );

  return MarginVariance;
};
