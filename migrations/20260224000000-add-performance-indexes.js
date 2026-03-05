"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log("Creating performance indexes...");

      // Index for orders table
      await queryInterface.addIndex("orders", ["is_active"], {
        name: "idx_orders_is_active",
      });
      console.log("✅ Created index: idx_orders_is_active");

      await queryInterface.addIndex("orders", ["created_at"], {
        name: "idx_orders_created_at",
        order: "DESC",
      });
      console.log("✅ Created index: idx_orders_created_at");

      // Index for order_products table
      await queryInterface.addIndex("order_products", ["order_id"], {
        name: "idx_order_products_order_id",
      });
      console.log("✅ Created index: idx_order_products_order_id");

      await queryInterface.addIndex("order_products", ["is_active"], {
        name: "idx_order_products_is_active",
      });
      console.log("✅ Created index: idx_order_products_is_active");

      // Index for sales_inventory table
      await queryInterface.addIndex("sales_inventory", ["product_master_id"], {
        name: "idx_sales_inventory_product_id",
      });
      console.log("✅ Created index: idx_sales_inventory_product_id");

      // Composite index for common queries
      await queryInterface.addIndex("orders", ["is_active", "created_at"], {
        name: "idx_orders_active_created",
      });
      console.log("✅ Created index: idx_orders_active_created");

      await queryInterface.addIndex(
        "order_products",
        ["order_id", "is_active"],
        {
          name: "idx_order_products_order_active",
        },
      );
      console.log("✅ Created index: idx_order_products_order_active");

      console.log("✅ All indexes created successfully!");
    } catch (error) {
      console.error("Error creating indexes:", error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log("Dropping performance indexes...");

      await queryInterface.removeIndex("orders", "idx_orders_is_active");
      await queryInterface.removeIndex("orders", "idx_orders_created_at");
      await queryInterface.removeIndex(
        "order_products",
        "idx_order_products_order_id",
      );
      await queryInterface.removeIndex(
        "order_products",
        "idx_order_products_is_active",
      );
      await queryInterface.removeIndex(
        "sales_inventory",
        "idx_sales_inventory_product_id",
      );
      await queryInterface.removeIndex("orders", "idx_orders_active_created");
      await queryInterface.removeIndex(
        "order_products",
        "idx_order_products_order_active",
      );

      console.log("✅ All indexes dropped successfully!");
    } catch (error) {
      console.error("Error dropping indexes:", error);
      throw error;
    }
  },
};
