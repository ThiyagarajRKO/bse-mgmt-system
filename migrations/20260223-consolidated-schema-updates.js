"use strict";

/**
 * Consolidated Schema Updates Migration
 *
 * Combines multiple schema-related migrations:
 * - migrate-derivatives-processing-type.js
 * - update-sizes-grades-direct.js
 * - migrate-map-raw-products-by-name.js
 * - run-order-id-migrations.js
 *
 * This migration updates schema for:
 * 1. Derivative processing levels and types
 * 2. Size and grade reference updates
 * 3. Product name mappings
 * 4. Order ID sequencing
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log("🔄 Starting Consolidated Schema Updates Migration...\n");

      // ============================================
      // Step 1: Add Derivative Processing Level Columns
      // ============================================
      console.log("Step 1️⃣  Adding derivative processing type columns...");

      try {
        const derivativeColumns =
          await queryInterface.describeTable("derivative_master");

        if (!derivativeColumns.processing_level) {
          await queryInterface.addColumn(
            "derivative_master",
            "processing_level",
            {
              type: Sequelize.ENUM(
                "RAW",
                "SEMI_PROCESSED",
                "PROCESSED",
                "COOKED",
                "VALUE_ADDED",
              ),
              allowNull: true,
              defaultValue: "RAW",
            },
            { transaction },
          );
          console.log("  ✅ Added processing_level to derivative_master");
        }

        if (!derivativeColumns.processing_type) {
          await queryInterface.addColumn(
            "derivative_master",
            "processing_type",
            {
              type: Sequelize.STRING(100),
              allowNull: true,
            },
            { transaction },
          );
          console.log("  ✅ Added processing_type to derivative_master");
        }

        if (!derivativeColumns.shelf_life_days) {
          await queryInterface.addColumn(
            "derivative_master",
            "shelf_life_days",
            {
              type: Sequelize.INTEGER,
              allowNull: true,
              defaultValue: 0,
            },
            { transaction },
          );
          console.log("  ✅ Added shelf_life_days to derivative_master");
        }
      } catch (err) {
        if (err.message.includes("already exists")) {
          console.log("  ℹ️  Derivative columns already exist");
        } else {
          throw err;
        }
      }

      // ============================================
      // Step 2: Update Size and Grade References
      // ============================================
      console.log("\nStep 2️⃣  Updating size and grade references...");

      try {
        const sizeColumns = await queryInterface.describeTable("size_master");

        if (!sizeColumns.sort_order) {
          await queryInterface.addColumn(
            "size_master",
            "sort_order",
            {
              type: Sequelize.INTEGER,
              allowNull: true,
              defaultValue: 0,
            },
            { transaction },
          );
          console.log("  ✅ Added sort_order to size_master");
        }

        if (!sizeColumns.is_active) {
          await queryInterface.addColumn(
            "size_master",
            "is_active",
            {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: true,
            },
            { transaction },
          );
          console.log("  ✅ Added is_active to size_master");
        }
      } catch (err) {
        if (err.message.includes("already exists")) {
          console.log("  ℹ️  Size columns already exist");
        } else {
          throw err;
        }
      }

      // ============================================
      // Step 3: Add Product Mapping Columns
      // ============================================
      console.log("\nStep 3️⃣  Adding product mapping reference columns...");

      try {
        const productColumns = await queryInterface.describeTable(
          "price_list_product_master",
        );

        if (!productColumns.raw_product_code) {
          await queryInterface.addColumn(
            "price_list_product_master",
            "raw_product_code",
            {
              type: Sequelize.STRING(50),
              allowNull: true,
            },
            { transaction },
          );
          console.log(
            "  ✅ Added raw_product_code to price_list_product_master",
          );
        }

        if (!productColumns.mapping_status) {
          await queryInterface.addColumn(
            "price_list_product_master",
            "mapping_status",
            {
              type: Sequelize.ENUM("MAPPED", "UNMAPPED", "PARTIAL"),
              allowNull: true,
              defaultValue: "UNMAPPED",
            },
            { transaction },
          );
          console.log("  ✅ Added mapping_status to price_list_product_master");
        }
      } catch (err) {
        if (err.message.includes("already exists")) {
          console.log("  ℹ️  Product mapping columns already exist");
        } else {
          throw err;
        }
      }

      // ============================================
      // Step 4: Add Order Sequencing Columns
      // ============================================
      console.log("\nStep 4️⃣  Adding order sequencing columns...");

      try {
        const orderColumns = await queryInterface.describeTable("orders");

        if (!orderColumns.order_sequence) {
          await queryInterface.addColumn(
            "orders",
            "order_sequence",
            {
              type: Sequelize.INTEGER,
              allowNull: true,
              unique: true,
            },
            { transaction },
          );
          console.log("  ✅ Added order_sequence to orders table");
        }

        if (!orderColumns.order_status) {
          await queryInterface.addColumn(
            "orders",
            "order_status",
            {
              type: Sequelize.ENUM(
                "PENDING",
                "PROCESSING",
                "COMPLETED",
                "CANCELLED",
              ),
              allowNull: false,
              defaultValue: "PENDING",
            },
            { transaction },
          );
          console.log("  ✅ Added order_status to orders table");
        }
      } catch (err) {
        if (err.message.includes("already exists")) {
          console.log("  ℹ️  Order columns already exist");
        } else {
          throw err;
        }
      }

      // ============================================
      // Step 5: Create Composite Indexes
      // ============================================
      console.log("\nStep 5️⃣  Creating performance indexes...");

      try {
        const indexes = await queryInterface.sequelize.query(
          `SELECT indexname FROM pg_indexes WHERE tablename = 'derivative_master'`,
        );
        const indexNames = indexes[0].map((idx) => idx.indexname);

        if (!indexNames.includes("idx_derivative_processing_type")) {
          await queryInterface.sequelize.query(
            "CREATE INDEX idx_derivative_processing_type ON derivative_master(processing_type, processing_level)",
            { transaction },
          );
          console.log("  ✅ Created idx_derivative_processing_type");
        }
      } catch (err) {
        console.log("  ℹ️  Index creation skipped (may already exist)");
      }

      try {
        const indexes = await queryInterface.sequelize.query(
          `SELECT indexname FROM pg_indexes WHERE tablename = 'orders'`,
        );
        const indexNames = indexes[0].map((idx) => idx.indexname);

        if (!indexNames.includes("idx_orders_sequence")) {
          await queryInterface.sequelize.query(
            "CREATE INDEX idx_orders_sequence ON orders(order_sequence)",
            { transaction },
          );
          console.log("  ✅ Created idx_orders_sequence");
        }
      } catch (err) {
        console.log("  ℹ️  Index creation skipped (may already exist)");
      }

      await transaction.commit();
      console.log(
        "\n✅ Consolidated Schema Updates Migration completed successfully!",
      );

      return Promise.resolve();
    } catch (error) {
      await transaction.rollback();
      console.error("\n❌ Migration failed:", error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log("↩️  Rolling back Consolidated Schema Updates Migration...");

      // Drop indexes
      try {
        await queryInterface.sequelize.query(
          "DROP INDEX IF EXISTS idx_derivative_processing_type",
          { transaction },
        );
        await queryInterface.sequelize.query(
          "DROP INDEX IF EXISTS idx_orders_sequence",
          { transaction },
        );
        console.log("  ✅ Dropped indexes");
      } catch (err) {
        console.log("  ℹ️  Index drop skipped");
      }

      // Remove columns in reverse order
      const tables = [
        "orders",
        "price_list_product_master",
        "size_master",
        "derivative_master",
      ];
      const columnsToRemove = {
        orders: ["order_status", "order_sequence"],
        price_list_product_master: ["mapping_status", "raw_product_code"],
        size_master: ["is_active", "sort_order"],
        derivative_master: [
          "shelf_life_days",
          "processing_type",
          "processing_level",
        ],
      };

      for (const [table, columns] of Object.entries(columnsToRemove)) {
        for (const column of columns) {
          try {
            await queryInterface.removeColumn(table, column, { transaction });
            console.log(`  ✅ Removed ${column} from ${table}`);
          } catch (err) {
            console.log(`  ℹ️  Column ${column} removal skipped`);
          }
        }
      }

      await transaction.commit();
      console.log("✅ Rollback completed");

      return Promise.resolve();
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Rollback failed:", error.message);
      throw error;
    }
  },
};
