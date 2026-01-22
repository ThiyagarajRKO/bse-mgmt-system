"use strict";
const { DataTypes } = require("sequelize");

/**
 * Inventory Stock - Real-time on-hand balances
 *
 * ONE RECORD per (product, warehouse, lot)
 * Always in sync with transactions
 *
 * States: RAW → WIP → FG → COGS
 */
module.exports = (sequelize) => {
  const InventoryStock = sequelize.define(
    "inventory_stock",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "Product code: RAW_SPECIES or SPECIES_DERIVATIVE_GRADE_SIZE",
      },
      unit_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: "RAW_INVENTORY, WIP_RAW_CONSUMPTION, FG_INVENTORY, etc",
      },
      lot_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Lot tracking for expiry & traceability",
      },
      on_hand_qty: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "Current physical quantity",
      },
      reserved_qty: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "Reserved for sales orders (optional)",
      },
      available_qty: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "on_hand_qty - reserved_qty (computed)",
      },
      uom: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "KG",
      },
      cost_layer_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Links to inventory_cost_layer for FIFO/LIFO",
      },
      last_transaction_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "inventory_stock",
      timestamps: false,
      underscored: true,
      indexes: [
        { fields: ["product_id", "unit_id", "lot_id"], unique: true },
        { fields: ["unit_id"] },
        { fields: ["on_hand_qty"] },
      ],
    },
  );

  InventoryStock.associate = (models) => {
    if (models.ProductMaster) {
      InventoryStock.belongsTo(models.ProductMaster, {
        foreignKey: "product_id",
      });
    }
    if (models.InventoryLot) {
      InventoryStock.belongsTo(models.InventoryLot, {
        foreignKey: "lot_id",
      });
    }
    if (models.InventoryCostLayer) {
      InventoryStock.belongsTo(models.InventoryCostLayer, {
        foreignKey: "cost_layer_id",
      });
    }
    if (models.InventoryTransaction) {
      InventoryStock.hasMany(models.InventoryTransaction, {
        foreignKey: "stock_id",
      });
    }
  };

  return InventoryStock;
};
