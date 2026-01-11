"use strict";
const { DataTypes } = require("sequelize");

/**
 * Inventory Transaction Log - Immutable audit trail
 * 
 * Every movement creates one transaction.
 * Never deleted (compliance).
 * Drives reconciliation & analytics.
 * 
 * Types: PRODUCTION_CONSUME, PRODUCTION_RECEIPT, DISPATCH, WASTE, ADJUSTMENT
 */
module.exports = (sequelize) => {
  const InventoryTransaction = sequelize.define(
    "inventory_transaction",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      stock_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "References inventory_stock (product+warehouse+lot)",
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      transaction_type: {
        type: DataTypes.ENUM(
          "PRODUCTION_CONSUME",
          "PRODUCTION_RECEIPT",
          "DISPATCH",
          "WASTE",
          "YIELD_VARIANCE",
          "ADJUSTMENT",
          "RETURN",
          "PHYSICAL_COUNT"
        ),
        allowNull: false,
      },
      qty_change: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        comment: "Positive=receipt, Negative=consumption",
      },
      uom: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "KG",
      },
      warehouse_from: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      warehouse_to: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      reference_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "production_order_id OR sales_order_id OR adjustment_id",
      },
      reference_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: "PRODUCTION_ORDER, SALES_ORDER, PHYSICAL_COUNT, etc",
      },
      batch_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      lot_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      cost_per_unit: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: true,
        comment: "Cost at time of transaction (FIFO/LIFO applied)",
      },
      total_cost: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: true,
        comment: "qty_change × cost_per_unit",
      },
      notes: DataTypes.TEXT,
      created_by: DataTypes.UUID,
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "inventory_transaction",
      timestamps: false,
      underscored: true,
      indexes: [
        { fields: ["product_id", "created_at"] },
        { fields: ["reference_id"] },
        { fields: ["transaction_type"] },
        { fields: ["created_at"] },
      ],
    }
  );

  InventoryTransaction.associate = (models) => {
    InventoryTransaction.belongsTo(models.inventory_stock, {
      foreignKey: "stock_id",
    });
    InventoryTransaction.belongsTo(models.product_master, {
      foreignKey: "product_id",
    });
  };

  return InventoryTransaction;
};
