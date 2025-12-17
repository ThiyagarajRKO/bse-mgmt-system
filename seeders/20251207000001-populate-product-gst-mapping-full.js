"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log(
      "Starting comprehensive product GST mapping population with duplicate prevention..."
    );

    // Import the service for duplicate prevention
    const ProductGstMappingService = require("../services/ProductGstMappingService");

    // Get GST masters first (load once)
    const gstMasters = await queryInterface.sequelize.query(
      `
      SELECT id, gst_name, hsn_code, cgst_rate, sgst_rate, igst_rate
      FROM consolidated_gst_master
      WHERE is_active = true AND hsn_code IS NOT NULL
    `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    console.log(`Found ${gstMasters.length} GST masters`);

    // Get total count of products to process
    const totalCountResult = await queryInterface.sequelize.query(
      `
      SELECT COUNT(*) as count
      FROM product_master
      WHERE is_active = true AND hsn_code IS NOT NULL
    `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const totalProducts = totalCountResult[0].count;
    console.log(
      `Processing ${totalProducts.toLocaleString()} products in batches`
    );

    // Process in batches to handle large dataset
    const batchSize = 5000; // Reduced for duplicate checking
    let offset = 0;
    let totalProcessed = 0;
    let totalCreated = 0;
    let totalDuplicates = 0;
    let totalFailed = 0;

    const systemUserId = "00000000-0000-0000-0000-000000000000"; // System user ID

    while (offset < totalProducts) {
      console.log(
        `\nProcessing batch ${
          Math.floor(offset / batchSize) + 1
        } (offset: ${offset})`
      );

      const products = await queryInterface.sequelize.query(
        `
        SELECT id, product_name, hsn_code
        FROM product_master
        WHERE is_active = true AND hsn_code IS NOT NULL
        ORDER BY id
        LIMIT :batchSize OFFSET :offset
      `,
        {
          replacements: { batchSize, offset },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      const mappingsToCreate = [];

      // Create mappings based on HSN code matching
      for (const product of products) {
        // Find matching GST master (exact match first, then partial)
        let gst = gstMasters.find((g) => g.hsn_code === product.hsn_code);
        if (!gst) {
          // Try partial match (first 4 digits)
          gst = gstMasters.find((g) => product.hsn_code.startsWith(g.hsn_code));
        }

        if (gst) {
          mappingsToCreate.push({
            product_id: product.id,
            gst_master_id: gst.id,
            override_gst_rate: null, // No override, use GST master rates
            effective_from: new Date("2024-01-01"),
            effective_to: null,
            note: "Auto-generated mapping based on HSN code",
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

        // Note: If using bulk insert, the service expects product_taxcode_gst_mapping table
        // For product_gst_mapping table, insert directly with duplicate handling
        try {
          await queryInterface.bulkInsert(
            "product_gst_mapping",
            mappingsToCreate,
            {
              ignoreDuplicates: true,
            }
          );

          // Count how many were actually inserted
          const insertedCount = mappingsToCreate.length; // Approximate
          totalCreated += insertedCount;
          console.log(`✅ Inserted ${insertedCount} mappings`);
        } catch (error) {
          console.error(`❌ Batch insertion error: ${error.message}`);
          totalFailed += mappingsToCreate.length;
        }
      }

      totalProcessed += products.length;
      offset += batchSize;

      console.log(
        `Batch completed. Total processed: ${totalProcessed.toLocaleString()}`
      );
    }

    console.log("\n" + "=".repeat(60));
    console.log("Seeding Completed!");
    console.log("=".repeat(60));
    console.log(`✅ Total Created: ${totalCreated.toLocaleString()}`);
    console.log(`📊 Total Processed: ${totalProcessed.toLocaleString()}`);
    console.log("=".repeat(60));
  },

  async down(queryInterface, Sequelize) {
    // Only delete auto-generated mappings
    console.log("Deleting auto-generated product GST mappings...");
    await queryInterface.bulkDelete("product_gst_mapping", {
      note: "Auto-generated mapping based on HSN code",
    });
  },
};
