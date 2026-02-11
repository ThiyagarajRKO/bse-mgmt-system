#!/usr/bin/env node
/**
 * Find all orders with PENDING allocation status
 */

const { sequelize } = require("./models");
const models = require("./models");

async function debugPendingAllocations() {
  try {
    console.log("🔍 Finding orders with PENDING allocation status...\n");

    // Find all orders with allocations
    const orders = await models.Orders.findAll({
      attributes: ["id", "order_no"],
      include: [
        {
          model: models.SalesAllocation,
          as: "SalesAllocations",
          attributes: ["id", "allocation_status", "allocated_quantity"],
          where: { is_active: true },
          required: false,
        },
      ],
      limit: 50,
    });

    console.log(`✅ Found ${orders.length} orders\n`);

    let foundPending = false;
    for (const order of orders) {
      const pendingAllocs = (order.SalesAllocations || []).filter(
        (alloc) => alloc.allocation_status === "PENDING_PURCHASE",
      );

      if (pendingAllocs.length > 0) {
        foundPending = true;
        console.log(`📦 Order: ${order.order_no} (${order.id})`);
        console.log(`   Allocations:`);
        for (const alloc of order.SalesAllocations) {
          console.log(
            `   - Status: ${alloc.allocation_status}, Qty: ${alloc.allocated_quantity}kg`,
          );
        }

        // Check if this order has approved purchases
        const approvedProcs = await models.ProcurementProducts.findAll({
          where: {
            order_id: order.id,
            status: "Approved",
            is_active: true,
          },
          attributes: ["id", "procurement_quantity", "status"],
        });

        console.log(`   Approved Procurements: ${approvedProcs.length}`);
        for (const proc of approvedProcs) {
          console.log(`   - ${proc.procurement_quantity}kg (${proc.status})`);
        }
        console.log();
      }
    }

    if (!foundPending) {
      console.log("✅ No orders with PENDING allocation status found");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

debugPendingAllocations();
