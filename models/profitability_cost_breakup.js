"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ProfitabilityCostBreakup extends Model {
    static associate(models) {
      // Define associations
      ProfitabilityCostBreakup.belongsTo(models.ProfitabilityFact, {
        foreignKey: "profitability_id",
        as: "profitabilityFact",
      });
    }
  }

  ProfitabilityCostBreakup.init(
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
      cost_type: {
        type: DataTypes.ENUM(
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
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "ProfitabilityCostBreakup",
      tableName: "profitability_cost_breakup",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );

  return ProfitabilityCostBreakup;
};
