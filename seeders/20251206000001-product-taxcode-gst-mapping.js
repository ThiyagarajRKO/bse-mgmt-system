"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log(
      "Starting bulk product-taxcode-gst mapping creation with duplicate prevention..."
    );

    // Import the service for duplicate prevention
    const ProductGstMappingService = require("../services/ProductGstMappingService");

    // Use efficient approach with duplicate prevention
    const batchSize = 5000; // Process in batches (smaller for duplicate check)

    // Get total count for progress tracking
    const totalProducts = await queryInterface.sequelize.query(
      `
      SELECT COUNT(*) as count
      FROM product_master
      WHERE is_active = true AND hsn_code IS NOT NULL
    `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const totalCount = totalProducts[0].count;
    console.log(
      `Processing ${totalCount.toLocaleString()} products in batches of ${batchSize}...`
    );

    let processed = 0;
    let totalCreated = 0;
    let totalDuplicates = 0;
    let totalFailed = 0;

    const systemUserId = "00000000-0000-0000-0000-000000000000"; // System user ID

    while (processed < totalCount) {
      console.log(
        `\nProcessing batch ${
          Math.floor(processed / batchSize) + 1
        } (offset: ${processed})...`
      );

      // Fetch products for this batch
      const products = await queryInterface.sequelize.query(
        `
        SELECT id, product_name, hsn_code
        FROM product_master
        WHERE is_active = true AND hsn_code IS NOT NULL
        ORDER BY id
        LIMIT :batchSize OFFSET :offset
      `,
        {
          replacements: { batchSize, offset: processed },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      // Get matching GST and Tax Code for each product
      const mappingsToCreate = [];

      for (const product of products) {
        const matches = await queryInterface.sequelize.query(
          `
          SELECT DISTINCT
            :productId as product_id,
            tc.tax_code_id,
            gst.id as gst_master_id,
            'OUTWARD'::text as supply_type
          FROM consolidated_gst_master gst
          INNER JOIN tax_code_master tc ON gst.hsn_code = tc.hsn_code OR :hsn LIKE tc.hsn_code || '%'
          WHERE gst.is_active = true 
            AND (:hsn = gst.hsn_code OR :hsn LIKE gst.hsn_code || '%')
            AND tc.supply_type = 'OUTWARD'
            AND gst.hsn_code IS NOT NULL
          LIMIT 1
        `,
          {
            replacements: {
              productId: product.id,
              hsn: product.hsn_code,
            },
            type: Sequelize.QueryTypes.SELECT,
          }
        );

        if (matches.length > 0) {
          const match = matches[0];
          mappingsToCreate.push({
            product_id: match.product_id,
            tax_code_id: match.tax_code_id,
            gst_master_id: match.gst_master_id,
            supply_type: match.supply_type,
            is_active: true,
            created_by: systemUserId,
          });
        }
      }

      // Bulk create with duplicate prevention
      if (mappingsToCreate.length > 0) {
        console.log(
          `Creating ${mappingsToCreate.length} mappings with duplicate check...`
        );

        const result = await ProductGstMappingService.bulkCreateMappings(
          mappingsToCreate,
          systemUserId
        );

        totalCreated += result.successful.length;
        totalDuplicates += result.duplicates.length;
        totalFailed += result.failed.length;

        console.log(
          `Batch result: Created=${result.successful.length}, Duplicates=${result.duplicates.length}, Failed=${result.failed.length}`
        );

        if (result.duplicates.length > 0) {
          console.log(`⚠️  Duplicates found: ${result.duplicates.length}`);
        }

        if (result.failed.length > 0) {
          console.log(`❌ Failed: ${result.failed.length}`);
          result.failed.slice(0, 3).forEach((fail) => {
            console.log(`   - ${fail.product_id}: ${fail.error}`);
          });
        }
      }

      processed += batchSize;
      console.log(`Progress: ${Math.min(processed, totalCount)}/${totalCount}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("Seeding Completed!");
    console.log("=".repeat(60));
    console.log(`✅ Total Created: ${totalCreated.toLocaleString()}`);
    console.log(`⚠️  Total Duplicates: ${totalDuplicates.toLocaleString()}`);
    console.log(`❌ Total Failed: ${totalFailed.toLocaleString()}`);
    console.log(
      `📊 Total Processed: ${totalCreated + totalDuplicates + totalFailed}`
    );
    console.log("=".repeat(60));

    return Promise.resolve();
  },

  async down(queryInterface, Sequelize) {
    console.log("Deleting all product-taxcode-gst mappings...");
    return queryInterface.bulkDelete("product_taxcode_gst_mapping", null, {});
  },
};
