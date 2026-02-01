"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log(
      "Starting consolidated order and delivery changes migration...",
    );

    // 1. Add order_id to packing table
    console.log("Adding order_id to packing table...");
    await queryInterface.sequelize.query(`
      ALTER TABLE packing ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE CASCADE;
    `);

    // 2. Add order_id to sales_inventory table
    console.log("Adding order_id to sales_inventory table...");
    await queryInterface.sequelize.query(`
      ALTER TABLE sales_inventory ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    // 3. Add order_id to dispatches table with index
    console.log("Adding order_id to dispatches table...");
    await queryInterface.sequelize.query(`
      ALTER TABLE dispatches ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL ON UPDATE CASCADE;
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS dispatches_order_id_idx ON dispatches(order_id);
    `);

    // 4. Add order_id to peeled_dispatches table
    console.log("Adding order_id to peeled_dispatches table...");
    await queryInterface.sequelize.query(`
      ALTER TABLE peeled_dispatches ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    // 5. Add order_id to peeling table
    console.log("Adding order_id to peeling table...");
    await queryInterface.sequelize.query(`
      ALTER TABLE peeling ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    // 6. Add order_id to procurement_lots table
    console.log("Adding order_id to procurement_lots table...");
    await queryInterface.sequelize.query(`
      ALTER TABLE procurement_lots ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    // 7. Add order_id to procurement_products table
    console.log("Adding order_id to procurement_products table...");
    await queryInterface.sequelize.query(`
      ALTER TABLE procurement_products ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    // 8. Add quantity column to order_products and migrate data
    console.log("Adding quantity column to order_products...");
    await queryInterface.sequelize.query(`
      ALTER TABLE order_products ADD COLUMN IF NOT EXISTS quantity DOUBLE PRECISION NOT NULL DEFAULT 0;
    `);

    // Note: Skipping data migration from unit to quantity as unit column doesn't exist
    // The quantity column is being added fresh

    // Add index for query performance
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS order_products_order_id_idx ON order_products(order_id);
    `);

    // 9. Add order_status to orders table (skipping as it already exists)
    console.log(
      "Skipping order_status addition - already exists with correct default",
    );

    // 10. Add order_id to purchase_inventory table
    console.log("Adding order_id to purchase_inventory table...");
    await queryInterface.sequelize.query(`
      ALTER TABLE purchase_inventory ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    console.log(
      "✓ Consolidated order and delivery changes migration completed successfully",
    );
  },

  async down(queryInterface, Sequelize) {
    console.log("Rolling back consolidated order and delivery changes...");

    // Reverse in opposite order
    await queryInterface.removeColumn("purchase_inventory", "order_id");
    await queryInterface.removeColumn("orders", "order_status");

    await queryInterface.removeIndex(
      "order_products",
      "order_products_order_id_idx",
    );
    await queryInterface.removeColumn("order_products", "quantity");

    await queryInterface.removeColumn("procurement_products", "order_id");
    await queryInterface.removeColumn("procurement_lots", "order_id");
    await queryInterface.removeColumn("peeling", "order_id");
    await queryInterface.removeColumn("peeled_dispatches", "order_id");

    await queryInterface.removeIndex("dispatches", "dispatches_order_id_idx");
    await queryInterface.removeColumn("dispatches", "order_id");

    await queryInterface.removeColumn("sales_inventory", "order_id");
    await queryInterface.removeColumn("packing", "order_id");

    console.log(
      "✓ Rollback of consolidated order and delivery changes completed",
    );
  },
};
