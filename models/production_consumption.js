"use strict";
const { DataTypes } = require("sequelize");

/**
 * Production Consumption - Raw material usage detail
 * 
 * ONE record per (production_order, raw product, lot)
 * Tracks what was consumed, from where, cost absorption
 * 
 * Row: PRODUCTION_ORDER | RAW_PRODUCT_ID | LOT_ID | QTY | COST
 */
module.exports = (sequelize) => {
  const ProductionConsumption = sequelize.define(
    "production_consumption",
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
      raw_product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "Product code: RAW_SPECIES (e.g., RAW_CUTTLEFISH)",
      },
      lot_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "inventory_lot", key: "id" },
      },
      cost_layer_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      planned_qty_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      consumed_qty_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: "Actual qty consumed from this lot",
      },
      cost_per_unit: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
      },
      total_cost: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        comment: "consumed_qty_kg × cost_per_unit",
      },
      warehouse_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "RAW_INVENTORY",
      },
      consumption_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("PLANNED", "ISSUED", "RECEIVED_IN_WIP"),
        defaultValue: "PLANNED",
      },
      created_by: DataTypes.UUID,
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: "production_consumption",
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ["production_order_id"] },
        { fields: ["lot_id"] },
        { fields: ["cost_layer_id"] },
      ],
    }
  );

  ProductionConsumption.associate = (models) => {
    ProductionConsumption.belongsTo(models.production_orders, {
      foreignKey: "production_order_id",
    });
    ProductionConsumption.belongsTo(models.product_master, {
      foreignKey: "raw_product_id",
    });
    ProductionConsumption.belongsTo(models.inventory_lot, {
      foreignKey: "lot_id",
    });
    ProductionConsumption.belongsTo(models.inventory_cost_layer, {
      foreignKey: "cost_layer_id",
    });
  };

  return ProductionConsumption;
};
