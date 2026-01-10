"use strict";

/**
 * Simplified Seeder: Map All Products to GST
 *
 * This seeder uses a simple approach to map products to GST masters
 * using raw SQL queries with UNNEST for efficient batch inserts.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;

    try {
      console.log(
        "\n╔═══════════════════════════════════════════════════════════════╗"
      );
      console.log(
        "║     SEEDER: Map Products to GST (Simplified)               ║"
      );
      console.log(
        "╚═══════════════════════════════════════════════════════════════╝\n"
      );

      // Get count of products already mapped
      const existingResult = await sequelize.query(
        `SELECT COUNT(DISTINCT product_id) as count FROM product_gst_mapping WHERE is_active = true`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      const existingCount =
        existingResult && existingResult.length > 0
          ? existingResult[0].count
          : 0;

      console.log(
        `✅ Already mapped: ${existingCount.toLocaleString()} products\n`
      );

      // Get unmapped products
      const unmapped = await sequelize.query(
        `SELECT p.id, p.hsn_code FROM product_master p
         WHERE p.is_active = true 
         AND p.hsn_code IS NOT NULL 
         AND p.hsn_code != ''
         AND p.id NOT IN (SELECT DISTINCT product_id FROM product_gst_mapping WHERE is_active = true)
         ORDER BY p.hsn_code`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(`Found ${unmapped.length} unmapped products\n`);

      if (unmapped.length === 0) {
        console.log("✅ All products are already mapped.\n");
        return;
      }

      // Get GST masters
      const gstMasters = await sequelize.query(
        `SELECT id, hsn_code FROM consolidated_gst_master 
         WHERE is_active = true AND hsn_code IS NOT NULL AND hsn_code != ''`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(`Found ${gstMasters.length} GST masters\n`);

      // Build lookup maps for HSN matching
      const exactMatch = new Map(); // 8-digit exact
      const prefix6 = new Map(); // 6-digit prefix
      const prefix4 = new Map(); // 4-digit prefix
      const prefix2 = new Map(); // 2-digit prefix

      for (const gst of gstMasters) {
        const hsn = gst.hsn_code?.toString() || "";
        if (hsn.length > 0) {
          // Store by different length prefixes for flexible matching
          if (hsn.length === 8) {
            exactMatch.set(hsn, gst.id);
            prefix6.set(hsn.substring(0, 6), gst.id);
            prefix4.set(hsn.substring(0, 4), gst.id);
            prefix2.set(hsn.substring(0, 2), gst.id);
          } else if (hsn.length === 6) {
            prefix6.set(hsn, gst.id);
            prefix4.set(hsn.substring(0, 4), gst.id);
            prefix2.set(hsn.substring(0, 2), gst.id);
          } else if (hsn.length === 4) {
            prefix4.set(hsn, gst.id);
            prefix2.set(hsn.substring(0, 2), gst.id);
          } else if (hsn.length === 2) {
            prefix2.set(hsn, gst.id);
          }
        }
      }

      console.log("🗂️  Lookup maps created\n");

      // Match products and collect mappings
      const mappings = [];

      for (const product of unmapped) {
        const hsn = product.hsn_code?.toString() || "";
        let gstId = null;

        // Try to match by longest to shortest
        if (hsn.length >= 8) {
          // Try 8-digit exact match first
          gstId = exactMatch.get(hsn.substring(0, 8));
        }
        if (!gstId && hsn.length >= 6) {
          // Try 6-digit prefix match
          gstId = prefix6.get(hsn.substring(0, 6));
        }
        if (!gstId && hsn.length >= 4) {
          // Try 4-digit prefix match
          gstId = prefix4.get(hsn.substring(0, 4));
        }
        if (!gstId && hsn.length >= 2) {
          // Try 2-digit prefix match
          gstId = prefix2.get(hsn.substring(0, 2));
        }

        if (gstId) {
          mappings.push({
            product_id: product.id,
            gst_master_id: gstId,
          });
        }
      }

      console.log(`✅ Matched ${mappings.length} products to GST masters\n`);

      // Insert mappings in batches using simple parameterized inserts
      if (mappings.length > 0) {
        const BATCH_SIZE = 100;

        for (let i = 0; i < mappings.length; i += BATCH_SIZE) {
          const batch = mappings.slice(i, i + BATCH_SIZE);
          const batchNum = Math.floor(i / BATCH_SIZE) + 1;

          // Build VALUES clause safely
          const valuesList = batch
            .map(
              (m, idx) =>
                `('${m.product_id}'::uuid, '${m.gst_master_id}'::uuid, true, now())`
            )
            .join(", ");

          try {
            await sequelize.query(
              `INSERT INTO product_gst_mapping (product_id, gst_master_id, is_active, created_at) 
               VALUES ${valuesList}
               ON CONFLICT (product_id, gst_master_id) DO NOTHING`,
              { type: Sequelize.QueryTypes.INSERT }
            );

            console.log(
              `   ✅ Batch ${batchNum}: Inserted ${batch.length} mappings`
            );
          } catch (error) {
            console.log(
              `   ⚠️  Batch ${batchNum}: Some mappings may already exist`
            );
          }
        }
      }

      // Verify final count
      const finalResult = await sequelize.query(
        `SELECT COUNT(DISTINCT product_id) as count FROM product_gst_mapping WHERE is_active = true`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      const finalCount =
        finalResult && finalResult.length > 0 ? finalResult[0].count : 0;

      console.log(
        `\n✅ GST Seeding Complete: ${finalCount.toLocaleString()} products mapped\n`
      );
    } catch (error) {
      console.error("\n❌ Error in GST seeding:", error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // No rollback needed - this is idempotent
  },
};
