"use strict";

/**
 * Migration: Create Inventory Management Tables
 * 
 * Creates:
 *   1. inventory_stock - Real-time balances
 *   2. inventory_transaction - Audit trail
 *   3. inventory_lot - Lot tracking
 *   4. inventory_cost_layer - FIFO/LIFO
 * 
 * Date: 11 January 2026
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. inventory_lot (dependency for stock & cost_layer)
    await queryInterface.createTable("inventory_lot", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      lot_number: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "product_master", key: "id" },
      },
      received_qty: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      remaining_qty: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      uom: {
        type: Sequelize.STRING(20),
        defaultValue: "KG",
      },
      received_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      expiry_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      supplier_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      certificate_of_analysis: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      cost_per_unit: {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: true,
      },
      total_cost: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex("inventory_lot", ["product_id", "received_date"]);
    await queryInterface.addIndex("inventory_lot", ["expiry_date"]);

    // 2. inventory_cost_layer (for FIFO tracking)
    await queryInterface.createTable("inventory_cost_layer", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      lot_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "inventory_lot", key: "id" },
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "product_master", key: "id" },
      },
      received_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      qty_received: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      qty_consumed: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      qty_remaining: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      cost_per_unit: {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: false,
      },
      total_received_cost: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
      },
      total_consumed_cost: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      fifo_sequence: {
        type: Sequelize.INTEGER,
        comment: "1=oldest, N=newest",
      },
      cost_method: {
        type: Sequelize.ENUM("FIFO", "LIFO", "WEIGHTED_AVG", "STANDARD"),
        allowNull: false,
        defaultValue: "FIFO",
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex("inventory_cost_layer", ["product_id", "received_date"]);
    await queryInterface.addIndex("inventory_cost_layer", ["fifo_sequence"]);

    // 3. inventory_stock (real-time balances)
    await queryInterface.createTable("inventory_stock", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "product_master", key: "id" },
      },
      warehouse_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: "RAW_INVENTORY, WIP_RAW_CONSUMPTION, FG_INVENTORY, etc",
      },
      lot_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "inventory_lot", key: "id" },
      },
      on_hand_qty: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      reserved_qty: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      available_qty: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      uom: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "KG",
      },
      cost_layer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "inventory_cost_layer", key: "id" },
      },
      last_transaction_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addConstraint("inventory_stock", {
      type: "unique",
      fields: ["product_id", "warehouse_code", "lot_id"],
      name: "unique_inventory_stock_composite",
    });

    await queryInterface.addIndex("inventory_stock", ["warehouse_code"]);
    await queryInterface.addIndex("inventory_stock", ["on_hand_qty"]);

    // 4. inventory_transaction (audit trail)
    await queryInterface.createTable("inventory_transaction", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      stock_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "inventory_stock", key: "id" },
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "product_master", key: "id" },
      },
      transaction_type: {
        type: Sequelize.ENUM(
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
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        comment: "+ve=receipt, -ve=consumption",
      },
      uom: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "KG",
      },
      warehouse_from: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      warehouse_to: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      reference_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: "production_order_id OR sales_order_id OR adjustment_id",
      },
      reference_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "PRODUCTION_ORDER, SALES_ORDER, PHYSICAL_COUNT, etc",
      },
      batch_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      lot_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "inventory_lot", key: "id" },
      },
      cost_per_unit: {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: true,
      },
      total_cost: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true,
      },
      notes: Sequelize.TEXT,
      created_by: Sequelize.UUID,
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex("inventory_transaction", ["product_id", "created_at"]);
    await queryInterface.addIndex("inventory_transaction", ["reference_id"]);
    await queryInterface.addIndex("inventory_transaction", ["transaction_type"]);
    await queryInterface.addIndex("inventory_transaction", ["created_at"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("inventory_transaction");
    await queryInterface.dropTable("inventory_stock");
    await queryInterface.dropTable("inventory_cost_layer");
    await queryInterface.dropTable("inventory_lot");
  },
};
