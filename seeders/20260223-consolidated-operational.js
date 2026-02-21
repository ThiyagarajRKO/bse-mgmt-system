"use strict";

/**
 * Consolidated Operational Seeder
 *
 * Combines:
 * - execute-purchase-allocation-flow.js (Allocation workflow automation)
 * - apply-sizes-grades.js (Size/grade application logic)
 *
 * This seeder:
 * 1. Populates purchase inventory data
 * 2. Auto-creates sales allocations
 * 3. Applies size and grade mappings
 */

const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log("🔄 Starting Consolidated Operational Seeder...\n");

      // ============================================
      // Step 1: Populate Purchase Inventory
      // ============================================
      console.log("Step 1️⃣  Populating purchase inventory...");

      try {
        const [procurementProducts] = await queryInterface.sequelize.query(
          `SELECT id, product_id, quantity_requested FROM procurement_products 
           WHERE status = 'APPROVED' LIMIT 20`,
          { transaction, type: queryInterface.sequelize.QueryTypes.SELECT },
        );

        let inventoryCount = 0;
        for (const pp of procurementProducts) {
          try {
            const [existing] = await queryInterface.sequelize.query(
              `SELECT id FROM purchase_inventory 
               WHERE procurement_product_id = $1 LIMIT 1`,
              {
                bind: [pp.id],
                transaction,
                type: queryInterface.sequelize.QueryTypes.SELECT,
              },
            );

            if (!existing) {
              const invId = uuidv4();
              await queryInterface.sequelize.query(
                `INSERT INTO purchase_inventory (
                  id, procurement_product_id, available_stock, reserved_stock, 
                  allocated_stock, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
                {
                  bind: [invId, pp.id, pp.quantity_requested, 0, 0],
                  transaction,
                },
              );
              inventoryCount++;
            }
          } catch (err) {
            console.log(`  ⚠️  Inventory creation skipped: ${err.message}`);
          }
        }
        console.log(
          `  ✅ Created ${inventoryCount} purchase inventory records`,
        );
      } catch (err) {
        console.log(
          `  ℹ️  Purchase inventory population skipped: ${err.message}`,
        );
      }

      // ============================================
      // Step 2: Auto-Create Sales Allocations
      // ============================================
      console.log("\nStep 2️⃣  Creating sales allocations...");

      try {
        const [orders] = await queryInterface.sequelize.query(
          `SELECT id FROM orders WHERE order_status = 'PENDING' LIMIT 10`,
          { transaction, type: queryInterface.sequelize.QueryTypes.SELECT },
        );

        let allocationCount = 0;
        for (const order of orders) {
          try {
            // Get order products
            const [orderProducts] = await queryInterface.sequelize.query(
              `SELECT id, quantity FROM order_products WHERE order_id = $1`,
              {
                bind: [order.id],
                transaction,
                type: queryInterface.sequelize.QueryTypes.SELECT,
              },
            );

            for (const op of orderProducts) {
              try {
                const [existing] = await queryInterface.sequelize.query(
                  `SELECT id FROM sales_allocations 
                   WHERE order_product_id = $1 AND status = 'ALLOCATED'`,
                  {
                    bind: [op.id],
                    transaction,
                    type: queryInterface.sequelize.QueryTypes.SELECT,
                  },
                );

                if (!existing) {
                  const allocId = uuidv4();
                  await queryInterface.sequelize.query(
                    `INSERT INTO sales_allocations (
                      id, order_product_id, allocated_quantity, status, 
                      created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, NOW(), NOW())`,
                    {
                      bind: [allocId, op.id, op.quantity, "ALLOCATED"],
                      transaction,
                    },
                  );
                  allocationCount++;
                }
              } catch (err) {
                console.log(
                  `  ⚠️  Allocation skipped for order product ${op.id}`,
                );
              }
            }
          } catch (err) {
            console.log(
              `  ⚠️  Allocation creation failed for order ${order.id}`,
            );
          }
        }
        console.log(`  ✅ Created ${allocationCount} sales allocations`);
      } catch (err) {
        console.log(`  ℹ️  Sales allocation creation skipped: ${err.message}`);
      }

      // ============================================
      // Step 3: Apply Size and Grade Mappings
      // ============================================
      console.log("\nStep 3️⃣  Applying size and grade mappings...");

      try {
        const [products] = await queryInterface.sequelize.query(
          `SELECT id FROM price_list_product_master WHERE size_id IS NULL LIMIT 20`,
          { transaction, type: queryInterface.sequelize.QueryTypes.SELECT },
        );

        let applicationsCount = 0;
        for (const product of products) {
          try {
            // Get default size
            const [defaultSize] = await queryInterface.sequelize.query(
              `SELECT id FROM size_master WHERE is_active = true LIMIT 1`,
              { transaction, type: queryInterface.sequelize.QueryTypes.SELECT },
            );

            if (defaultSize) {
              await queryInterface.sequelize.query(
                `UPDATE price_list_product_master 
                 SET size_id = $1, updated_at = NOW() 
                 WHERE id = $2`,
                {
                  bind: [defaultSize.id, product.id],
                  transaction,
                },
              );
              applicationsCount++;
            }
          } catch (err) {
            console.log(`  ⚠️  Size mapping failed for product ${product.id}`);
          }
        }
        console.log(`  ✅ Applied ${applicationsCount} size mappings`);
      } catch (err) {
        console.log(
          `  ℹ️  Size/grade mapping application skipped: ${err.message}`,
        );
      }

      // ============================================
      // Step 4: Create Operational Indexes
      // ============================================
      console.log("\nStep 4️⃣  Creating operational indexes...");

      try {
        const indexes = await queryInterface.sequelize.query(
          `SELECT indexname FROM pg_indexes WHERE tablename = 'purchase_inventory'`,
        );
        const indexNames = indexes[0].map((idx) => idx.indexname);

        if (!indexNames.includes("idx_purchase_inventory_status")) {
          await queryInterface.sequelize.query(
            `CREATE INDEX idx_purchase_inventory_status 
             ON purchase_inventory(available_stock, allocated_stock)`,
            { transaction },
          );
          console.log("  ✅ Created idx_purchase_inventory_status");
        }
      } catch (err) {
        console.log("  ℹ️  Index creation skipped");
      }

      try {
        const indexes = await queryInterface.sequelize.query(
          `SELECT indexname FROM pg_indexes WHERE tablename = 'sales_allocations'`,
        );
        const indexNames = indexes[0].map((idx) => idx.indexname);

        if (!indexNames.includes("idx_sales_allocations_status")) {
          await queryInterface.sequelize.query(
            `CREATE INDEX idx_sales_allocations_status ON sales_allocations(status, order_product_id)`,
            { transaction },
          );
          console.log("  ✅ Created idx_sales_allocations_status");
        }
      } catch (err) {
        console.log("  ℹ️  Index creation skipped");
      }

      await transaction.commit();
      console.log(
        "\n✅ Consolidated Operational Seeder completed successfully!",
      );

      return Promise.resolve();
    } catch (error) {
      await transaction.rollback();
      console.error("\n❌ Seeding failed:", error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log("↩️  Rolling back Consolidated Operational Seeder...");

      // Drop indexes
      try {
        await queryInterface.sequelize.query(
          "DROP INDEX IF EXISTS idx_purchase_inventory_status",
          { transaction },
        );
        await queryInterface.sequelize.query(
          "DROP INDEX IF EXISTS idx_sales_allocations_status",
          { transaction },
        );
        console.log("  ✅ Dropped indexes");
      } catch (err) {
        console.log("  ℹ️  Index drop skipped");
      }

      // Data cleanup is minimal - these are transient operational records
      console.log(
        "  ℹ️  Operational records preserved (manual cleanup may be needed)",
      );

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
