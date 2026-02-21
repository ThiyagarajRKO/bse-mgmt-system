/**
 * Seed PeelingProducts and Autopopulate QA Checklist
 *
 * This script:
 * 1. Seeds PeelingProducts for each Peeling record
 * 2. Autopopulates QA Checklist entries for all peeled products
 */

const path = require("path");
const db = require(path.join(__dirname, "..", "models"));
const { v4: uuidv4 } = require("uuid");

async function seedAndAutopopulate() {
  try {
    console.log("🚀 Starting seed and autopopulation process...\n");

    // Step 1: Get all Peeling records
    const peelings = await db.Peeling.findAll({
      attributes: ["id", "peeling_quantity", "order_id", "created_at"],
      raw: true,
    });

    console.log(`📦 Found ${peelings.length} peeling records\n`);

    // Step 2: Get some products to link
    const products = await db.ProductMaster.findAll({
      attributes: ["id", "product_name"],
      limit: 5,
      raw: true,
    });

    console.log(`🏭 Found ${products.length} products available\n`);

    if (products.length === 0) {
      console.log("❌ No products found. Cannot seed peeling products.");
      process.exit(1);
    }

    let productsCreated = 0;
    const productsLog = [];

    // Use the admin profile ID directly
    const ADMIN_PROFILE_ID = "87ffbaff-b7e9-4198-90d2-0fa12d85ef82";
    console.log(`👤 Using admin profile ID: ${ADMIN_PROFILE_ID}\n`);

    // Step 3: Create PeelingProducts for each Peeling
    for (const peeling of peelings) {
      // Pick a random product
      const randomProduct =
        products[Math.floor(Math.random() * products.length)];
      const yieldQty =
        Math.floor((peeling.peeling_quantity || 1000) * 0.8) +
        Math.floor(Math.random() * 200);

      try {
        const peelProduct = await db.PeelingProducts.create(
          {
            id: require("uuid").v4(),
            peeling_id: peeling.id,
            product_master_id: randomProduct.id,
            yield_quantity: yieldQty,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            profile_id: ADMIN_PROFILE_ID,
          },
        );

        productsCreated++;
        productsLog.push({
          id: peelProduct.id,
          peeling_id: peeling.id,
          product: randomProduct.product_name,
          quantity: yieldQty,
        });

        console.log(
          `✅ Created PeelingProduct for peeling ${peeling.id.substring(0, 8)}`,
        );
      } catch (err) {
        console.log(
          `❌ Error creating PeelingProduct for peeling ${peeling.id.substring(0, 8)}: ${err.message}`,
        );
      }
    }

    console.log(`\n✅ Created ${productsCreated} peeling products\n`);

    // Step 4: Now autopopulate QA from peeled products
    console.log("🔍 Starting QA autopopulation...\n");

    const peelingRecords = await db.Peeling.findAll({
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

    console.log(
      `📋 Found ${peelingRecords.length} peeling records with products\n`,
    );

    let qaCreatedCount = 0;
    let qaSkippedCount = 0;
    let qaErrorCount = 0;
    const qaCreatedRecords = [];

    for (const peeling of peelingRecords) {
      if (!peeling.PeelingProducts || peeling.PeelingProducts.length === 0) {
        console.log(
          `⏭️  Skipping peeling ${peeling.id.substring(0, 8)} - no products`,
        );
        qaSkippedCount++;
        continue;
      }

      // Check if QA record already exists
      const existingQA = await db.QAChecklist.findOne({
        where: { peeling_id: peeling.id },
      });

      if (existingQA) {
        console.log(
          `⏭️  Skipping peeling ${peeling.id.substring(0, 8)} - QA already exists`,
        );
        qaSkippedCount++;
        continue;
      }

      try {
        const primaryProduct = peeling.PeelingProducts[0];
        const productMaster = primaryProduct.ProductMaster;

        if (!productMaster) {
          console.log(
            `⚠️  Skipping peeling ${peeling.id.substring(0, 8)} - no product master`,
          );
          qaSkippedCount++;
          continue;
        }

        const totalYield = peeling.PeelingProducts.reduce(
          (sum, pp) => sum + (parseFloat(pp.yield_quantity) || 0),
          0,
        );

        // Generate lot_no: QA-<ProcurementLot> format
        let lot_no = null;
        if (peeling.Order?.procurement_lots?.[0]?.procurement_lot) {
          lot_no = `QA-${peeling.Order.procurement_lots[0].procurement_lot}`;
        } else {
          // Fallback if no procurement lot found
          lot_no = `QA-AUTO-${peeling.id.substring(0, 8)}`;
        }

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
          status: "PENDING",
          inspection_date: new Date(),
        });

        qaCreatedCount++;
        console.log(
          `✅ Created QA for peeling ${peeling.id.substring(0, 8)} - Lot: ${lot_no}`,
        );

        qaCreatedRecords.push({
          id: qaRecord.id,
          lot_no: qaRecord.lot_no,
          peeling_id: qaRecord.peeling_id,
          peeled_product_id: qaRecord.peeled_product_id,
          product: qaRecord.product,
          quantity: qaRecord.quantity,
        });
      } catch (err) {
        qaErrorCount++;
        console.log(
          `❌ Error creating QA for peeling ${peeling.id.substring(0, 8)}: ${err.message}`,
        );
      }
    }

    // Final Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 OPERATION SUMMARY");
    console.log("=".repeat(60));

    console.log("\n🔧 SEEDING PHASE:");
    console.log(`   ✅ Created: ${productsCreated} peeling products`);

    console.log("\n📋 QA AUTOPOPULATION PHASE:");
    console.log(`   ✅ Created: ${qaCreatedCount} QA records`);
    console.log(`   ⏭️  Skipped: ${qaSkippedCount} records`);
    console.log(`   ❌ Errors:  ${qaErrorCount} records`);

    console.log(`\n📈 FINAL COUNTS:`);
    const finalPeelProducts = await db.PeelingProducts.count();
    const finalQA = await db.QAChecklist.count();
    console.log(`   PeelingProducts: ${finalPeelProducts}`);
    console.log(`   QAChecklist:     ${finalQA}`);

    if (qaCreatedCount > 0) {
      console.log("\n📋 Created QA Records:");
      qaCreatedRecords.forEach((record, idx) => {
        console.log(`   ${idx + 1}. ${record.lot_no}`);
        console.log(`      - Product: ${record.product}`);
        console.log(`      - Quantity: ${record.quantity}`);
        console.log(`      - Peeled Product ID: ${record.peeled_product_id}`);
      });
    }

    console.log("\n" + "=".repeat(60));
    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

seedAndAutopopulate();
