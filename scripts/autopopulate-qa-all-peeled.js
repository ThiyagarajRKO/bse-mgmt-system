/**
 * Autopopulate QA Checklist from All Peeled Products
 *
 * This script creates QA checklist records for all peeled products that:
 * 1. Have a corresponding peeling record
 * 2. Don't already have a QA checklist entry
 * 3. Are linked to valid orders
 */

const path = require("path");
const db = require(path.join(__dirname, "..", "models"));

async function autopopulateQAFromPeeledProducts() {
  try {
    console.log("🔍 Starting QA autopopulation from peeled products...\n");

    // Step 1: Get all peeling records with their products
    const peelings = await db.Peeling.findAll({
      include: [
        {
          model: db.PeelingProducts,
          attributes: [
            "id",
            "peeling_id",
            "product_master_id",
            "yield_quantity",
          ],
          include: [
            {
              model: db.ProductMaster,
              attributes: ["id", "product_name"],
            },
          ],
        },
        {
          model: db.Orders,
          attributes: ["id", "order_no"],
          include: [
            {
              model: db.ProcurementLots,
              as: "procurement_lots",
              attributes: ["id", "procurement_lot"],
              limit: 1,
            },
          ],
        },
      ],
      raw: false,
      subQuery: false,
    });

    console.log(`📦 Found ${peelings.length} peeling records\n`);

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const createdRecords = [];

    for (const peeling of peelings) {
      if (!peeling.PeelingProducts || peeling.PeelingProducts.length === 0) {
        console.log(
          `⏭️  Skipping peeling ${peeling.id.substring(0, 8)} - no products`,
        );
        skippedCount++;
        continue;
      }

      // Check if QA record already exists for this peeling
      const existingQA = await db.QAChecklist.findOne({
        where: { peeling_id: peeling.id },
      });

      if (existingQA) {
        console.log(
          `⏭️  Skipping peeling ${peeling.id.substring(0, 8)} - QA already exists`,
        );
        skippedCount++;
        continue;
      }

      try {
        // Get primary product from first peeling product
        const primaryProduct = peeling.PeelingProducts[0];
        const productMaster = primaryProduct.ProductMaster;

        if (!productMaster) {
          console.log(
            `⚠️  Skipping peeling ${peeling.id.substring(0, 8)} - no product master`,
          );
          skippedCount++;
          continue;
        }

        // Calculate total yield from all peeling products
        const totalYield = peeling.PeelingProducts.reduce(
          (sum, pp) => sum + (parseFloat(pp.yield_quantity) || 0),
          0,
        );

        // Generate lot_no: append -QA to procurement_lot if available
        let lot_no = `AUTO-QA-${peeling.id.substring(0, 8)}`;
        if (peeling.Order?.procurement_lots?.[0]?.procurement_lot) {
          lot_no = `${peeling.Order.procurement_lots[0].procurement_lot}-QA`;
        }

        // Create QA record
        const qaRecord = await db.QAChecklist.create({
          lot_no: lot_no,
          order_id: peeling.order_id,
          peeling_id: peeling.id,
          peeled_product_id: primaryProduct.id,
          product: productMaster.product_name,
          quantity: totalYield,
          broken_percentage: 0,
          glazing_percentage: 0,
          temperature: 20,
          odour_status: "GOOD",
          appearance_status: "GOOD",
          foreign_matter: false,
          sample_size: 100,
          net_weight_avg: 95,
          status: "Pending",
          inspection_date: new Date(),
        });

        createdCount++;
        console.log(
          `✅ Created QA for peeling ${peeling.id.substring(0, 8)} - Lot: ${lot_no}`,
        );

        createdRecords.push({
          id: qaRecord.id,
          lot_no: qaRecord.lot_no,
          peeling_id: qaRecord.peeling_id,
          peeled_product_id: qaRecord.peeled_product_id,
          product: qaRecord.product,
          quantity: qaRecord.quantity,
          status: qaRecord.status,
        });
      } catch (err) {
        errorCount++;
        console.log(
          `❌ Error creating QA for peeling ${peeling.id.substring(0, 8)}: ${err.message}`,
        );
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 AUTOPOPULATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Created:  ${createdCount} QA records`);
    console.log(`⏭️  Skipped:  ${skippedCount} records`);
    console.log(`❌ Errors:   ${errorCount} records`);
    console.log(`📦 Total:    ${peelings.length} peeling records processed`);
    console.log("=".repeat(60));

    if (createdCount > 0) {
      console.log("\n📋 Created QA Records:");
      createdRecords.forEach((record, idx) => {
        console.log(`  ${idx + 1}. ${record.lot_no}`);
        console.log(`     - Product: ${record.product}`);
        console.log(`     - Quantity: ${record.quantity}`);
        console.log(`     - Peeled Product ID: ${record.peeled_product_id}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

autopopulateQAFromPeeledProducts();
