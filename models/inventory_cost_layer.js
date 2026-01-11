"use strict";
const { DataTypes } = require("sequelize");

/**
 * Inventory Cost Layer - FIFO/LIFO absorption
 *
 * ONE record per (lot, received date)
 * Tracks cost flow through warehouse → production → FG → COGS
 *
 * FIFO: Consume oldest cost layers first
 * LIFO: Consume newest cost layers first
 */
module.exports = (sequelize) => {
  const InventoryCostLayer = sequelize.define(
    "inventory_cost_layer",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      lot_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "inventory_lot", key: "id" },
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      received_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      qty_received: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      qty_consumed: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      qty_remaining: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      cost_per_unit: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        comment: "Unit cost at receipt",
      },
      total_received_cost: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
      },
      total_consumed_cost: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      fifo_sequence: {
        type: DataTypes.INTEGER,
        comment: "Order for FIFO consumption (1=oldest, N=newest)",
      },
      cost_method: {
        type: DataTypes.ENUM("FIFO", "LIFO", "WEIGHTED_AVG", "STANDARD"),
        allowNull: false,
        defaultValue: "FIFO",
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "inventory_cost_layer",
      timestamps: false,
      underscored: true,
      indexes: [
        { fields: ["product_id", "received_date"] },
        { fields: ["fifo_sequence"] },
      ],
    }
  );

  InventoryCostLayer.associate = (models) => {
    InventoryCostLayer.belongsTo(models.inventory_lot, {
      foreignKey: "lot_id",
    });
    InventoryCostLayer.belongsTo(models.product_master, {
      foreignKey: "product_id",
    });
  };

  return InventoryCostLayer;
};
