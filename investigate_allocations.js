#!/usr/bin/env node
/**
 * Comprehensive investigation of allocation issues
 */

const { sequelize } = require("./models");
const models = require("./models");

async function investigate() {
  try {
    console.log("🔍 COMPREHENSIVE ALLOCATION INVESTIGATION\n");
    console.log("=".repeat(60) + "\n");

    // 1. Count statuses
    console.log("1. ALLOCATION STATUS DISTRIBUTION:");
    const statusCounts = await models.SalesAllocation.findAll({
      attributes: [
        "allocation_status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: { is_active: true },
      group: ["allocation_status"],
      raw: true,
    });

    for (const row of statusCounts) {
      console.log(`   ${row.allocation_status}: ${row.count}`);
    }
    console.log();

    // 2. Check for PENDING allocations with approved purchases
    console.log("2. PENDING ALLOCATIONS WITH APPROVED PURCHASES:");
    const problematicAllocations = await sequelize.query(
      `
      SELECT 
        sa.id,
        sa.order_id,
        sa.allocation_status,
        COUNT(DISTINCT pp.id) as approved_procurements
      FROM sales_allocations sa
      LEFT JOIN procurement_products pp ON pp.order_id = sa.order_id 
        AND pp.status = 'Approved'
        AND pp.is_active = true
      WHERE sa.is_active = true 
        AND sa.allocation_status = 'PENDING'
      GROUP BY sa.id, sa.order_id, sa.allocation_status
      LIMIT 10
    `,
      { type: sequelize.QueryTypes.SELECT },
    );

    if (problematicAllocations.length === 0) {
      console.log("   ✅ None found");
    } else {
      console.log(`   ❌ Found ${problematicAllocations.length}:`);
      for (const alloc of problematicAllocations) {
        console.log(`   - Allocation ${alloc.id} (Order ${alloc.order_id})`);
        console.log(`     Status: ${alloc.allocation_status}`);
        console.log(
          `     Approved Procurements: ${alloc.approved_procurements}\n`,
        );
      }
    }

    // 3. Check allocations created before purchase approval
    console.log("3. ALLOCATIONS CREATED BEFORE ANY PURCHASE APPROVAL:");
    const earlyAllocations = await sequelize.query(
      `
      SELECT 
        sa.id,
        sa.order_id,
        sa.allocation_status,
        sa.created_at,
        MIN(pp.created_at) as first_procurement,
        COUNT(pp.id) as total_procurements,
        SUM(CASE WHEN pp.status = 'Approved' THEN 1 ELSE 0 END) as approved_count
      FROM sales_allocations sa
      LEFT JOIN procurement_products pp ON pp.order_id = sa.order_id
      WHERE sa.is_active = true
      GROUP BY sa.id, sa.order_id, sa.allocation_status, sa.created_at
      HAVING COUNT(pp.id) > 0
      LIMIT 10
    `,
      { type: sequelize.QueryTypes.SELECT },
    );

    console.log(
      `   Found ${earlyAllocations.length} allocations with procurement history:`,
    );
    for (const alloc of earlyAllocations.slice(0, 5)) {
      console.log(`   - Allocation ${alloc.id} (Order ${alloc.order_id})`);
      console.log(`     Status: ${alloc.allocation_status}`);
      console.log(`     Created: ${alloc.created_at}`);
      console.log(`     Total Procurements: ${alloc.total_procurements}`);
      console.log(`     Approved: ${alloc.approved_count}\n`);
    }

    // 4. Direct query for any PENDING status
    console.log("4. ANY REMAINING PENDING ALLOCATIONS:");
    const remaining = await models.SalesAllocation.count({
      where: {
        allocation_status: "PENDING",
        is_active: true,
      },
    });
    console.log(`   Count: ${remaining}`);
    if (remaining > 0) {
      console.log(
        `   ❌ Found ${remaining} allocations still in PENDING status`,
      );
    }
    console.log();

    // 5. Check GetAllocationData logic
    console.log("5. ALLOCATION STATUS DISPLAY LOGIC:");
    console.log('   The GetAllocationData function shows "Pending" when:');
    console.log("   - No SalesAllocation records exist, OR");
    console.log("   - Not all order products have allocations, OR");
    console.log("   - Not all allocations are ALLOCATED/COMPLETED");
    console.log();
    console.log('   It shows "Allocated" when:');
    console.log("   - All order products have allocations AND");
    console.log("   - All allocations are ALLOCATED or COMPLETED AND");
    console.log(
      "   - NO pending purchases (approvedProcurementCount = 0 if hasPendingPurchase)",
    );
    console.log();

    console.log("✅ Investigation complete\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

investigate();
