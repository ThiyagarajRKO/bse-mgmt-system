"use strict";

/**
 * Consolidated Seeder: Map All Products to GST
 *
 * This seeder ensures that ALL products in product_master are mapped to GST masters,
 * using intelligent HSN prefix matching:
 *
 * 1. Exact 8-digit HSN match (e.g., 03042990 → 03042990)
 * 2. 6-digit HSN prefix match (e.g., 030429XX → 030429)
 * 3. 4-digit HSN prefix match (e.g., 0304XXXX → 0304)
 * 4. 2-digit chapter match (e.g., 03XXXXXX → 03)
 *
 * Processes 758,000+ products in batches for optimal performance.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log(
      "\n╔═══════════════════════════════════════════════════════════════╗"
    );
    console.log(
      "║     SEEDER: Map All Products to GST by HSN Matching         ║"
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════════╝\n"
    );

    const sequelize = queryInterface.sequelize;
    const startTime = Date.now();

    try {
      // ═══════════════════════════════════════════════════════════════
      // PHASE 1: Fetch GST Masters and Products
      // ═══════════════════════════════════════════════════════════════
      console.log("📚 PHASE 1: Loading GST Masters and Products\n");

      console.log("   Fetching GST masters with HSN codes...");
      const gstMasters = await sequelize.query(
        `SELECT id, gst_name, hsn_code FROM consolidated_gst_master 
         WHERE is_active = true AND hsn_code IS NOT NULL AND hsn_code != '' 
         ORDER BY hsn_code`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      console.log(
        `   ✅ Found ${gstMasters.length.toLocaleString()} GST masters\n`
      );

      console.log("   Fetching unmapped products with HSN codes...");
      const unmappedProducts = await sequelize.query(
        `SELECT p.id, p.product_name, p.hsn_code FROM product_master p
         WHERE p.is_active = true 
         AND (p.hsn_code IS NOT NULL AND p.hsn_code != '')
         AND p.id NOT IN (SELECT product_id FROM product_gst_mapping WHERE is_active = true)
         ORDER BY p.hsn_code`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      console.log(
        `   ✅ Found ${unmappedProducts.length.toLocaleString()} unmapped products\n`
      );

      // ═══════════════════════════════════════════════════════════════
      // PHASE 2: Create HSN Lookup Maps
      // ═══════════════════════════════════════════════════════════════
      console.log("🗂️  PHASE 2: Creating HSN Lookup Maps\n");

      const gstBy8Digit = new Map();
      const gstBy6Digit = new Map();
      const gstBy4Digit = new Map();
      const gstBy2Digit = new Map();

      for (const gst of gstMasters) {
        const hsn = gst.hsn_code.padStart(8, "0");

        // 8-digit match
        gstBy8Digit.set(hsn, gst.id);

        // 6-digit match
        if (hsn.length >= 6) {
          const prefix6 = hsn.substring(0, 6);
          if (!gstBy6Digit.has(prefix6)) {
            gstBy6Digit.set(prefix6, gst.id);
          }
        }

        // 4-digit match
        if (hsn.length >= 4) {
          const prefix4 = hsn.substring(0, 4);
          if (!gstBy4Digit.has(prefix4)) {
            gstBy4Digit.set(prefix4, gst.id);
          }
        }

        // 2-digit match (chapter)
        if (hsn.length >= 2) {
          const prefix2 = hsn.substring(0, 2);
          if (!gstBy2Digit.has(prefix2)) {
            gstBy2Digit.set(prefix2, gst.id);
          }
        }
      }

      console.log(
        `   ✅ 8-digit lookups: ${gstBy8Digit.size.toLocaleString()}`
      );
      console.log(
        `   ✅ 6-digit lookups: ${gstBy6Digit.size.toLocaleString()}`
      );
      console.log(
        `   ✅ 4-digit lookups: ${gstBy4Digit.size.toLocaleString()}`
      );
      console.log(
        `   ✅ 2-digit lookups: ${gstBy2Digit.size.toLocaleString()}\n`
      );

      // ═══════════════════════════════════════════════════════════════
      // PHASE 3: Match Products to GST Masters
      // ═══════════════════════════════════════════════════════════════
      console.log("🔍 PHASE 3: Matching Products to GST Masters\n");

      const mappings = [];
      let exact8 = 0,
        exact6 = 0,
        exact4 = 0,
        exact2 = 0,
        unmatched = 0;

      for (const product of unmappedProducts) {
        const hsn = product.hsn_code.padStart(8, "0");
        let gstId = null;
        let matchType = "none";

        // Try 8-digit exact match
        if (gstBy8Digit.has(hsn)) {
          gstId = gstBy8Digit.get(hsn);
          matchType = "8-digit";
          exact8++;
        }
        // Try 6-digit prefix match
        else if (hsn.length >= 6) {
          const prefix6 = hsn.substring(0, 6);
          if (gstBy6Digit.has(prefix6)) {
            gstId = gstBy6Digit.get(prefix6);
            matchType = "6-digit";
            exact6++;
          }
        }
        // Try 4-digit prefix match
        if (!gstId && hsn.length >= 4) {
          const prefix4 = hsn.substring(0, 4);
          if (gstBy4Digit.has(prefix4)) {
            gstId = gstBy4Digit.get(prefix4);
            matchType = "4-digit";
            exact4++;
          }
        }
        // Try 2-digit prefix match (fallback)
        if (!gstId && hsn.length >= 2) {
          const prefix2 = hsn.substring(0, 2);
          if (gstBy2Digit.has(prefix2)) {
            gstId = gstBy2Digit.get(prefix2);
            matchType = "2-digit";
            exact2++;
          }
        }

        if (!gstId) {
          unmatched++;
        } else {
          mappings.push({
            product_id: product.id,
            gst_master_id: gstId,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          });
        }
      }

      console.log("   📊 Matching Results:");
      console.log(
        `      ✅ 8-digit exact matches:     ${exact8.toLocaleString()}`
      );
      console.log(
        `      ✅ 6-digit prefix matches:    ${exact6.toLocaleString()}`
      );
      console.log(
        `      ✅ 4-digit prefix matches:    ${exact4.toLocaleString()}`
      );
      console.log(
        `      ✅ 2-digit prefix matches:    ${exact2.toLocaleString()}`
      );
      console.log(
        `      ❌ Unmatched products:        ${unmatched.toLocaleString()}\n`
      );

      // ═══════════════════════════════════════════════════════════════
      // PHASE 4: Bulk Insert Mappings
      // ═══════════════════════════════════════════════════════════════
      if (mappings.length > 0) {
        console.log(
          `⚙️  PHASE 4: Inserting ${mappings.length.toLocaleString()} Mappings\n`
        );

        const BATCH_SIZE = 10000;
        let successCount = 0;
        let batchNum = 0;

        for (let i = 0; i < mappings.length; i += BATCH_SIZE) {
          batchNum++;
          const batch = mappings.slice(i, i + BATCH_SIZE);

          try {
            // Check for existing mappings
            const productIds = batch.map((m) => `'${m.product_id}'`).join(", ");
            const existing = await sequelize.query(
              `SELECT product_id FROM product_gst_mapping 
               WHERE product_id IN (${productIds}) AND is_active = true`,
              { type: Sequelize.QueryTypes.SELECT }
            );

            const existingSet = new Set(existing.map((m) => m.product_id));
            const toInsert = batch.filter(
              (m) => !existingSet.has(m.product_id)
            );

            if (toInsert.length > 0) {
              await sequelize.query(
                `INSERT INTO product_gst_mapping 
                 (product_id, gst_master_id, is_active, created_at, updated_at) 
                 VALUES ${toInsert
                   .map(
                     (m) =>
                       `('${m.product_id}', '${m.gst_master_id}', true, NOW(), NOW())`
                   )
                   .join(", ")}`,
                { raw: true }
              );
              successCount += toInsert.length;
              console.log(
                `   ✅ Batch ${batchNum}: Inserted ${toInsert.length.toLocaleString()} mappings`
              );
            } else {
              console.log(
                `   ⏭️  Batch ${batchNum}: All products already mapped`
              );
            }
          } catch (error) {
            console.error(`   ❌ Batch ${batchNum} failed: ${error.message}`);
            throw error;
          }
        }

        console.log();
      }

      // ═══════════════════════════════════════════════════════════════
      // PHASE 5: Final Verification
      // ═══════════════════════════════════════════════════════════════
      console.log("✅ PHASE 5: Final Verification\n");

      const coverage = await sequelize.query(
        `SELECT 
          (SELECT COUNT(*) FROM product_master WHERE is_active = true) as total,
          (SELECT COUNT(DISTINCT product_id) FROM product_gst_mapping WHERE is_active = true) as mapped
        `,
        { type: Sequelize.QueryTypes.SELECT }
      );

      const stats = coverage[0];
      const coveragePercent = ((stats.mapped / stats.total) * 100).toFixed(2);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log("   📈 Coverage Statistics:");
      console.log(
        `      Total Products:              ${stats.total.toLocaleString()}`
      );
      console.log(
        `      Mapped Products:             ${stats.mapped.toLocaleString()}`
      );
      console.log(`      Coverage:                    ${coveragePercent}%`);
      console.log(`      Duration:                    ${duration}s\n`);

      // Check for unmapped products
      const unmappedCheck = await sequelize.query(
        `SELECT p.id, p.product_name FROM product_master p
         WHERE p.is_active = true
         AND p.id NOT IN (SELECT product_id FROM product_gst_mapping WHERE is_active = true)
         LIMIT 5`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (unmappedCheck.length > 0) {
        console.log("   ⚠️  Sample Unmapped Products:");
        unmappedCheck.forEach((p, i) => {
          console.log(`      ${i + 1}. ${p.product_name}`);
        });
        console.log();
      } else {
        console.log("   ✅ ALL PRODUCTS SUCCESSFULLY MAPPED!\n");
      }

      console.log(
        "╔═══════════════════════════════════════════════════════════════╗"
      );
      console.log(
        "║                    SEEDING COMPLETE                          ║"
      );
      console.log(
        "╚═══════════════════════════════════════════════════════════════╝\n"
      );

      return {
        status: "success",
        totalProducts: stats.total,
        mappedProducts: stats.mapped,
        coverage: coveragePercent,
        duration: duration,
      };
    } catch (error) {
      console.error("\n❌ SEEDING FAILED:", error.message);
      console.error(error.stack);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * Rollback: Remove product GST mappings created by this seeder
     *
     * Note: We preserve mappings for safety. Uncomment below only if you need to
     * remove all product_gst_mapping entries.
     */
    console.log("\n⚠️  Rolling back product GST mappings...");
    console.log("   (Mappings are preserved for data safety)\n");

    // Uncomment only if you want to delete all mappings:
    // await queryInterface.sequelize.query(
    //   `TRUNCATE TABLE product_gst_mapping CASCADE`,
    //   { raw: true }
    // );
  },
};

/**
 * USAGE:
 *
 * npm run seed -- --seed 20251212000000-seed-all-product-gst-mappings.js
 *
 * Or to run all seeders:
 * npm run seed
 */
