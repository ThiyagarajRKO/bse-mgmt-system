"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ProfitabilityFact extends Model {
    static associate(models) {
      // Define associations
      ProfitabilityFact.belongsTo(models.Orders, {
        foreignKey: "invoice_id",
        as: "invoice",
      });

      ProfitabilityFact.belongsTo(models.ProductMaster, {
        foreignKey: "product_id",
        as: "product",
      });

      ProfitabilityFact.belongsTo(models.SpeciesMaster, {
        foreignKey: "species_id",
        as: "species",
      });

      ProfitabilityFact.belongsTo(models.CustomerMaster, {
        foreignKey: "customer_id",
        as: "customer",
      });

      ProfitabilityFact.belongsTo(models.ProcurementLots, {
        foreignKey: "batch_id",
        as: "batch",
      });

      ProfitabilityFact.hasMany(models.ProfitabilityCostBreakup, {
        foreignKey: "profitability_id",
        as: "costBreakups",
      });

      ProfitabilityFact.hasMany(models.ProfitabilityAlert, {
        foreignKey: "profitability_id",
        as: "alerts",
      });
    }
  }

  ProfitabilityFact.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      invoice_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "orders",
          key: "id",
        },
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "product_master",
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
      customer_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "customer_master",
          key: "id",
        },
      },
      batch_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "procurement_lots",
          key: "id",
        },
      },
      sku_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      market: {
        type: DataTypes.ENUM("DOMESTIC", "EXPORT"),
        allowNull: false,
      },
      quantity_kg: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0,
      },
      net_revenue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      cogs: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      packaging_cost: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      logistics_cost: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      yield_loss_cost: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      discount_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      gross_margin: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      gross_margin_pct: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      posting_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "ProfitabilityFact",
      tableName: "profitability_fact",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return ProfitabilityFact;
};
