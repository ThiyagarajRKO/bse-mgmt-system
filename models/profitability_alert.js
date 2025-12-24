"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ProfitabilityAlert extends Model {
    static associate(models) {
      // Define associations
      ProfitabilityAlert.belongsTo(models.ProfitabilityFact, {
        foreignKey: "profitability_id",
        as: "profitabilityFact",
      });

      ProfitabilityAlert.belongsTo(models.Users, {
        foreignKey: "acknowledged_by",
        as: "acknowledgedBy",
      });
    }
  }

  ProfitabilityAlert.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      profitability_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "profitability_fact",
          key: "id",
        },
      },
      alert_type: {
        type: DataTypes.ENUM(
          "MARGIN_BELOW_MINIMUM",
          "MARGIN_DROP_WOW",
          "YIELD_LOSS_EXCESSIVE",
          "DISCOUNT_EXCEEDS_MARGIN",
          "NEGATIVE_MARGIN"
        ),
        allowNull: false,
      },
      severity: {
        type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"),
        allowNull: false,
        defaultValue: "MEDIUM",
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      threshold_value: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      actual_value: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      is_acknowledged: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      acknowledged_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      acknowledged_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "ProfitabilityAlert",
      tableName: "profitability_alerts",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );

  return ProfitabilityAlert;
};
