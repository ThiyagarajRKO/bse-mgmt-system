"use strict";
const { DataTypes } = require("sequelize");

/**
 * Inventory Lot - Traceability & expiry tracking
 *
 * One lot per raw material purchase/receipt
 * Links to cost layer for FIFO
 * Tracks expiry, supplier, etc
 */
module.exports = (sequelize) => {
  const InventoryLot = sequelize.define(
    "inventory_lot",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      lot_number: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: "Supplier lot / batch number",
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      received_qty: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      remaining_qty: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      uom: {
        type: DataTypes.STRING(20),
        defaultValue: "KG",
      },
      received_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      expiry_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      supplier_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      certificate_of_analysis: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      cost_per_unit: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: true,
      },
      total_cost: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "inventory_lot",
      timestamps: false,
      underscored: true,
      indexes: [
        { fields: ["product_id", "received_date"] },
        { fields: ["expiry_date"] },
      ],
    }
  );

  InventoryLot.associate = (models) => {
    InventoryLot.belongsTo(models.product_master, {
      foreignKey: "product_id",
    });
  };

  return InventoryLot;
};
