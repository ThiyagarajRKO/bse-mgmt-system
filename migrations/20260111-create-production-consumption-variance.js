"use strict";

/**
 * Migration: Create Production Consumption & Variance Tables
 *
 * Creates:
 *   1. production_consumption - Raw material detail tracking
 *   2. production_variance - Yield loss & variance posting
 *
 * Date: 11 January 2026
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. production_consumption
    await queryInterface.createTable("production_consumption", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      production_order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "production_orders", key: "id" },
      },
      raw_product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "product_master", key: "id" },
        comment: "Product code: RAW_SPECIES",
      },
      lot_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "inventory_lot", key: "id" },
      },
      cost_layer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "inventory_cost_layer", key: "id" },
      },
      planned_qty_kg: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      consumed_qty_kg: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: "Actual qty consumed from this lot",
      },
      cost_per_unit: {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: false,
      },
      total_cost: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        comment: "consumed_qty_kg × cost_per_unit",
      },
      warehouse_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "RAW_INVENTORY",
      },
      consumption_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("PLANNED", "ISSUED", "RECEIVED_IN_WIP"),
        defaultValue: "PLANNED",
      },
      created_by: Sequelize.UUID,
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex("production_consumption", [
      "production_order_id",
    ]);
    await queryInterface.addIndex("production_consumption", ["lot_id"]);
    await queryInterface.addIndex("production_consumption", ["cost_layer_id"]);

    // 2. production_variance
    await queryInterface.createTable("production_variance", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      production_order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "production_orders", key: "id" },
      },
      derivative_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "derivative_master", key: "id" },
        comment: "Which derivative this variance belongs to",
      },
      planned_qty_kg: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      actual_qty_kg: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      variance_qty_kg: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: "actual - planned (negative=loss, positive=gain)",
      },
      variance_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        comment: "variance_qty / planned_qty × 100",
      },
      variance_type: {
        type: Sequelize.ENUM(
          "NORMAL_LOSS",
          "ABNORMAL_LOSS",
          "GRADE_VARIANCE",
          "SIZE_VARIANCE",
          "QUALITY_LOSS"
        ),
        allowNull: false,
        defaultValue: "NORMAL_LOSS",
      },
      variance_reason: {
        type: Sequelize.TEXT,
        comment: "Why did variance occur? (Operator notes)",
      },
      variance_cost: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true,
        comment: "Cost of variance",
      },
      gl_posted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: "Only ABNORMAL_LOSS posts to GL",
      },
      gl_entry_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      created_by: Sequelize.UUID,
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex("production_variance", [
      "production_order_id",
    ]);
    await queryInterface.addIndex("production_variance", ["variance_type"]);
    await queryInterface.addIndex("production_variance", ["gl_posted"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("production_variance");
    await queryInterface.dropTable("production_consumption");
  },
};
