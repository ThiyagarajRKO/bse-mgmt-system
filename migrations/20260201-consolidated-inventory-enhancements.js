"use strict";

/**
 * CONSOLIDATED INVENTORY ENHANCEMENTS MIGRATION
 *
 * This migration consolidates the following individual migrations:
 * - 20260128-add-order-id-to-purchase-inventory.js
 * - 20260128102928-add-missing-inventory-columns.js
 *
 * Adds order tracking and availability columns to inventory tables,
 * plus GST master reference to product master.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("Starting consolidated inventory enhancements migration...");

    // 1. Add order_id to purchase_inventory table
    console.log("Adding order_id to purchase_inventory table...");
    await queryInterface.sequelize.query(`
      ALTER TABLE purchase_inventory ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE CASCADE;
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS purchase_inventory_order_id_idx ON purchase_inventory(order_id);
    `);

    // 2. Add available_quantity to sales_inventory table
    console.log("Adding available_quantity to sales_inventory table...");
    await queryInterface.sequelize.query(`
      ALTER TABLE sales_inventory ADD COLUMN IF NOT EXISTS available_quantity DECIMAL(10,2) NOT NULL DEFAULT 0;
    `);

    // 3. Add available_quantity to purchase_inventory table
    console.log("Adding available_quantity to purchase_inventory table...");
    await queryInterface.sequelize.query(`
      ALTER TABLE purchase_inventory ADD COLUMN IF NOT EXISTS available_quantity DECIMAL(10,2) NOT NULL DEFAULT 0;
    `);

    // 4. Add gst_master_id to product_master table
    console.log("Adding gst_master_id to product_master table...");
    await queryInterface.sequelize.query(`
      ALTER TABLE product_master ADD COLUMN IF NOT EXISTS gst_master_id UUID REFERENCES consolidated_gst_master(id) ON UPDATE CASCADE ON DELETE SET NULL;
    `);

    // 5. Set default values for existing records
    console.log("Setting default values for existing records...");
    await queryInterface.sequelize.query(`
      UPDATE sales_inventory
      SET available_quantity = quantity
      WHERE available_quantity = 0 OR available_quantity IS NULL
    `);

    await queryInterface.sequelize.query(`
      UPDATE purchase_inventory
      SET available_quantity = quantity
      WHERE available_quantity = 0 OR available_quantity IS NULL
    `);

    console.log(
      "Consolidated inventory enhancements migration completed successfully",
    );
  },

  async down(queryInterface, Sequelize) {
    console.log("Reverting consolidated inventory enhancements migration...");

    // Remove gst_master_id from product_master
    await queryInterface.removeColumn("product_master", "gst_master_id");

    // Remove available_quantity from purchase_inventory
    await queryInterface.removeColumn(
      "purchase_inventory",
      "available_quantity",
    );

    // Remove available_quantity from sales_inventory
    await queryInterface.removeColumn("sales_inventory", "available_quantity");

    // Remove order_id index and column from purchase_inventory
    await queryInterface.removeIndex(
      "purchase_inventory",
      "purchase_inventory_order_id_idx",
    );
    await queryInterface.removeColumn("purchase_inventory", "order_id");

    console.log(
      "Consolidated inventory enhancements migration reverted successfully",
    );
  },
};
