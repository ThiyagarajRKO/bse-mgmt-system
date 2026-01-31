"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("Starting consolidated order and delivery changes migration...");

    // 1. Add order_id to packing table
    console.log("Adding order_id to packing table...");
    await queryInterface.addColumn("packing", "order_id", {
      type: Sequelize.UUID,
      allowNull: true,
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
      references: {
        model: { tableName: "orders" },
        key: "id",
      },
    });

    // 2. Add order_id to sales_inventory table
    console.log("Adding order_id to sales_inventory table...");
    await queryInterface.addColumn("sales_inventory", "order_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: { tableName: "orders" },
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    // 3. Add order_id to dispatches table with index
    console.log("Adding order_id to dispatches table...");
    await queryInterface.addColumn("dispatches", "order_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: { tableName: "orders" },
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
      comment: "Reference to the sales order for which this dispatch is made",
    });
    await queryInterface.addIndex("dispatches", ["order_id"], {
      name: "dispatches_order_id_idx",
    });

    // 4. Add order_id to peeled_dispatches table
    console.log("Adding order_id to peeled_dispatches table...");
    await queryInterface.addColumn("peeled_dispatches", "order_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: { tableName: "orders" },
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    // 5. Add order_id to peeling table
    console.log("Adding order_id to peeling table...");
    await queryInterface.addColumn("peeling", "order_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: { tableName: "orders" },
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    // 6. Add order_id to procurement_lots table
    console.log("Adding order_id to procurement_lots table...");
    await queryInterface.addColumn("procurement_lots", "order_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: { tableName: "orders" },
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    // 7. Add order_id to procurement_products table
    console.log("Adding order_id to procurement_products table...");
    await queryInterface.addColumn("procurement_products", "order_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: { tableName: "orders" },
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    // 8. Add quantity column to order_products and migrate data
    console.log("Adding quantity column to order_products...");
    await queryInterface.addColumn("order_products", "quantity", {
      type: Sequelize.DOUBLE,
      allowNull: false,
      defaultValue: 0,
      comment: "Quantity of products ordered (renamed from unit)",
    });

    // Migrate data from unit to quantity
    await queryInterface.sequelize.query(`
      UPDATE order_products
      SET quantity = unit
      WHERE quantity IS NULL OR quantity = 0
    `);

    // Add index for query performance
    await queryInterface.addIndex("order_products", ["order_id"], {
      name: "order_products_order_id_idx",
    });

    // 9. Add order_status to orders table
    console.log("Adding order_status to orders table...");
    await queryInterface.addColumn("orders", "order_status", {
      type: Sequelize.ENUM(
        "DRAFT",
        "CONFIRMED",
        "ALLOCATED",
        "IN_PRODUCTION",
        "READY_FOR_QA",
        "QA_APPROVED",
        "PACKED",
        "READY_FOR_DISPATCH",
        "DISPATCHED",
        "INVOICED",
        "CLOSED",
        "CANCELLED",
      ),
      allowNull: true,
      defaultValue: "DRAFT",
    });

    // 10. Add order_id to purchase_inventory table
    console.log("Adding order_id to purchase_inventory table...");
    await queryInterface.addColumn("purchase_inventory", "order_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: { tableName: "orders" },
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    console.log("✓ Consolidated order and delivery changes migration completed successfully");
  },

  async down(queryInterface, Sequelize) {
    console.log("Rolling back consolidated order and delivery changes...");

    // Reverse in opposite order
    await queryInterface.removeColumn("purchase_inventory", "order_id");
    await queryInterface.removeColumn("orders", "order_status");

    await queryInterface.removeIndex("order_products", "order_products_order_id_idx");
    await queryInterface.removeColumn("order_products", "quantity");

    await queryInterface.removeColumn("procurement_products", "order_id");
    await queryInterface.removeColumn("procurement_lots", "order_id");
    await queryInterface.removeColumn("peeling", "order_id");
    await queryInterface.removeColumn("peeled_dispatches", "order_id");

    await queryInterface.removeIndex("dispatches", "dispatches_order_id_idx");
    await queryInterface.removeColumn("dispatches", "order_id");

    await queryInterface.removeColumn("sales_inventory", "order_id");
    await queryInterface.removeColumn("packing", "order_id");

    console.log("✓ Rollback of consolidated order and delivery changes completed");
  },
};