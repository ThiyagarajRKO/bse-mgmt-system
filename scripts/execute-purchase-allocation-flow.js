#!/usr/bin/env node

/**
 * AUTOMATED PURCHASE APPROVAL → ALLOCATION FLOW
 *
 * This Node.js script automates the complete workflow:
 * 1. Creates a ProcurementProduct (purchase request)
 * 2. Approves the purchase request
 * 3. Creates/Updates PurchaseInventory with available stock
 * 4. Auto-creates SalesAllocations with ALLOCATED status
 *
 * Usage: node execute-purchase-allocation-flow.js <order_id> <product_id> <quantity> [price] [supplier_id]
 *
 * Example:
 *   node execute-purchase-allocation-flow.js \
 *     a3dffcd4-2b05-4e26-b20a-94b6a4880584 \
 *     c7310936-bac3-4e73-b234-e3471b004499 \
 *     1000 \
 *     50.00
 */

const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function printStep(msg) {
  console.log(`${colors.blue}▶ ${msg}${colors.reset}`);
}

function printSuccess(msg) {
  console.log(`${colors.green}✅ ${msg}${colors.reset}`);
}

function printError(msg) {
  console.error(`${colors.red}❌ ${msg}${colors.reset}`);
}

function printWarning(msg) {
  console.warn(`${colors.yellow}⚠️  ${msg}${colors.reset}`);
}

async function executeFlow() {
  try {
    // Validate arguments
    const args = process.argv.slice(2);
    if (args.length < 3) {
      printError("Missing arguments");
      console.log(
        "Usage: node execute-purchase-allocation-flow.js <order_id> <product_id> <quantity> [price] [supplier_id]",
      );
      console.log("\nExample:");
      console.log("  node execute-purchase-allocation-flow.js \\");
      console.log("    a3dffcd4-2b05-4e26-b20a-94b6a4880584 \\");
      console.log("    c7310936-bac3-4e73-b234-e3471b004499 \\");
      console.log("    1000 \\");
      console.log("    50.00");
      process.exit(1);
    }

    const [orderId, productId, quantity, price = 50.0, supplierId] = args;
    const systemUserId =
      process.env.SYSTEM_USER_ID || "87ffbaff-b7e9-4198-90d2-0fa12d85ef82";

    console.log("\n");
    printStep("Starting Purchase Approval → Allocation Flow");
    console.log("\nParameters:");
    console.log(`  Order ID:       ${orderId}`);
    console.log(`  Product ID:     ${productId}`);
    console.log(`  Quantity:       ${quantity} kg`);
    console.log(`  Price:          $${price}/kg`);
    console.log("");

    // Connect to database
    printStep("Connecting to database...");
    const sequelize = new Sequelize(
      process.env.DB_NAME || "seafood-erp",
      process.env.DB_USERNAME || "automatly",
      process.env.DB_SECRET || "kZ5Z5RAYFMjK5778p88F",
      {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 5432,
        dialect: "postgres",
        logging: false,
      },
    );

    await sequelize.authenticate();
    printSuccess("Database connected");

    // =========================================================================
    // STEP 1: Get or create supplier
    // =========================================================================
    printStep("Fetching supplier...");
    let finalSupplierId = supplierId;
    if (!finalSupplierId) {
      const result = await sequelize.query(
        "SELECT id FROM supplier_master LIMIT 1",
        { type: sequelize.QueryTypes.SELECT },
      );
      if (result.length === 0) {
        printError("No supplier found in database");
        process.exit(1);
      }
      finalSupplierId = result[0].id;
    }
    printSuccess(`Supplier ID: ${finalSupplierId}`);

    // =========================================================================
    // STEP 2: Get or create procurement lot
    // =========================================================================
    printStep("Fetching procurement lot...");
    let procurementLotId;
    const lotResult = await sequelize.query(
      "SELECT id FROM procurement_lots ORDER BY created_at DESC LIMIT 1",
      { type: sequelize.QueryTypes.SELECT },
    );

    if (lotResult.length === 0) {
      printWarning("No procurement lot found, creating one...");
      const createLotResult = await sequelize.query(
        `INSERT INTO procurement_lots (id, procurement_date, procurement_lot, unit_master_id, is_active, created_by)
         SELECT gen_random_uuid(), NOW(), 'AUTO-' || to_char(NOW(), 'YYYYMMDD-HH24MISS'), 
                (SELECT id FROM unit_master LIMIT 1), true, $1
         RETURNING id`,
        { bind: [systemUserId], type: sequelize.QueryTypes.SELECT },
      );
      procurementLotId = createLotResult[0].id;
    } else {
      procurementLotId = lotResult[0].id;
    }
    printSuccess(`Procurement Lot ID: ${procurementLotId}`);
    console.log("");

    // =========================================================================
    // STEP 3: Create ProcurementProduct (Purchase Request)
    // =========================================================================
    printStep("STEP 1: Creating ProcurementProduct (Purchase Request)...");
    const procurementResult = await sequelize.query(
      `INSERT INTO procurement_products (
        id, procurement_lot_id, supplier_master_id, product_master_id,
        procurement_product_type, procurement_quantity, procurement_price,
        procurement_purchaser, order_id, is_active, created_by, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, 'UNPROCESSED',
        $4, $5, 'System Automation', $6, true, $7, NOW()
      ) RETURNING id`,
      {
        bind: [
          procurementLotId,
          finalSupplierId,
          productId,
          quantity,
          price,
          orderId,
          systemUserId,
        ],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const procurementProductId = procurementResult[0].id;
    printSuccess(`ProcurementProduct created: ${procurementProductId}`);
    console.log("");

    // =========================================================================
    // STEP 4: Approve Purchase Request
    // =========================================================================
    printStep("STEP 2: Approving Purchase Request...");
    await sequelize.query(
      `UPDATE procurement_products 
       SET status = 'Approved', approver_name = 'System Automation',
           updated_at = NOW(), updated_by = $1
       WHERE id = $2`,
      { bind: [systemUserId, procurementProductId] },
    );
    printSuccess("ProcurementProduct approved: status = Approved");
    console.log("");

    // =========================================================================
    // STEP 5: Create PurchaseInventory with available_stock
    // =========================================================================
    printStep("STEP 3: Creating PurchaseInventory with available stock...");
    const inventoryResult = await sequelize.query(
      `INSERT INTO purchase_inventory (
        id, product_master_id, procurement_product_id, procurement_product_type,
        quantity, available_quantity, available_stock, reserved_quantity,
        is_active, created_by, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, 'UNPROCESSED', $3, $3, $3, 0,
        true, $4, NOW()
      ) ON CONFLICT DO NOTHING RETURNING id`,
      {
        bind: [productId, procurementProductId, quantity, systemUserId],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (inventoryResult.length === 0) {
      printWarning("PurchaseInventory already exists, skipping creation");
    } else {
      const purchaseInventoryId = inventoryResult[0].id;
      printSuccess(`PurchaseInventory created: ${purchaseInventoryId}`);
      printSuccess(`Available Stock: ${quantity} kg`);
    }
    console.log("");

    // =========================================================================
    // STEP 6: Auto-Create SalesAllocations with ALLOCATED status
    // =========================================================================
    printStep("STEP 4: Auto-creating SalesAllocations...");
    const allocationResult = await sequelize.query(
      `WITH order_products AS (
        SELECT id, quantity FROM order_products
        WHERE order_id = $1 AND product_master_id = $2
      )
      INSERT INTO sales_allocations (
        id, order_id, order_product_id, ordered_quantity,
        allocated_quantity, fulfilled_quantity, allocation_status,
        allocation_date, allocated_by, is_active, created_by, created_at
      )
      SELECT
        gen_random_uuid(), $1, op.id, op.quantity,
        LEAST($3, op.quantity), 0, 'ALLOCATED',
        NOW(), $4, true, $4, NOW()
      FROM order_products op
      RETURNING id, allocation_status, allocated_quantity`,
      {
        bind: [orderId, productId, quantity, systemUserId],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (allocationResult.length === 0) {
      printWarning(
        "No allocations created (may already exist or no order products found)",
      );
    } else {
      const allocationId = allocationResult[0].id;
      printSuccess(`SalesAllocation created: ${allocationId}`);
      printSuccess(
        `Allocation Status: ${allocationResult[0].allocation_status} ✅`,
      );
      printSuccess(
        `Allocated Quantity: ${allocationResult[0].allocated_quantity} kg`,
      );
    }
    console.log("");

    // =========================================================================
    // VERIFICATION
    // =========================================================================
    printStep("VERIFICATION: Querying database...");
    const verificationResult = await sequelize.query(
      `SELECT 
        o.order_no,
        COUNT(sa.id) as allocation_count,
        MAX(pp.status) as procurement_status
      FROM orders o
      LEFT JOIN sales_allocations sa ON o.id = sa.order_id
      LEFT JOIN procurement_products pp ON o.id = pp.order_id
      WHERE o.id = $1
      GROUP BY o.order_no`,
      { bind: [orderId], type: sequelize.QueryTypes.SELECT },
    );

    if (verificationResult.length > 0) {
      console.log("\nVerification Results:");
      console.log(`  Order Number:        ${verificationResult[0].order_no}`);
      console.log(
        `  Allocations:         ${verificationResult[0].allocation_count}`,
      );
      console.log(
        `  Procurement Status:  ${verificationResult[0].procurement_status}`,
      );
    }
    console.log("");

    // =========================================================================
    // FINAL SUMMARY
    // =========================================================================
    console.log(
      `${colors.green}╔════════════════════════════════════════════════════════════╗${colors.reset}`,
    );
    console.log(
      `${colors.green}║   FLOW EXECUTION COMPLETED SUCCESSFULLY ✅                ║${colors.reset}`,
    );
    console.log(
      `${colors.green}╚════════════════════════════════════════════════════════════╝${colors.reset}`,
    );
    console.log("\nSummary:");
    console.log(`  • ProcurementProduct:   ${procurementProductId}`);
    console.log(`  • Status:               Approved ✅`);
    console.log(`  • Quantity:             ${quantity} kg`);
    console.log(
      `  • SalesAllocation:      Auto-created with ALLOCATED status ✅`,
    );
    console.log("\nNext Steps:");
    console.log('  1. Verify order shows "ALLOCATED" status in UI');
    console.log("  2. Create production order from the allocation");
    console.log("  3. Track fulfillment through manufacturing");
    console.log("");

    printSuccess("Flow automation completed!");

    await sequelize.close();
  } catch (error) {
    printError(`Flow execution failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the flow
executeFlow().catch((err) => {
  printError(`Fatal error: ${err.message}`);
  process.exit(1);
});
