"use strict";

/**
 * CONSOLIDATED GST MASTER DATA SEEDER
 *
 * This seeder consolidates the following individual seeders:
 * - 20251125165148-add-seafood-gst-records.js
 * - 20251205134601-add-comprehensive-gst-master-data.js
 * - 20251206000001-product-taxcode-gst-mapping.js
 * - 20251207000001-populate-product-gst-mapping-full.js
 * - 20251212000000-seed-all-product-gst-mappings.js
 *
 * Creates comprehensive GST master data and product GST mappings.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const effectiveFrom = new Date("2017-07-01");
    const systemUserId = "00000000-0000-0000-0000-000000000000";

    console.log("Starting consolidated GST master data seeding...");

    // Get the first company ID for seeding
    const companies = await queryInterface.sequelize.query(
      "SELECT id FROM company_master LIMIT 1;",
      { type: Sequelize.QueryTypes.SELECT }
    );
    const companyId = companies.length > 0 ? companies[0].id : null;

    // ============================================================================
    // PHASE 1: SEED CONSOLIDATED GST MASTER DATA
    // ============================================================================

    const gstMasterData = [
      // RAW SEAFOOD (HSN 0301-0308) - 0% GST
      {
        gst_rate_id: "0001-raw-seafood",
        gst_name: "Live fish – fresh, chilled",
        hsn_code: "0301",
        gst_rate_percent: 0,
        gst_type: "INTER",
        cgst_rate: 0.0,
        sgst_rate: 0.0,
        igst_rate: 0.0,
        export_gst: 0.0,
        effective_from: effectiveFrom,
        effective_to: null,
        is_active: true,
        company_id: companyId,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        gst_rate_id: "0002-fish-fresh",
        gst_name: "Fish – fresh or chilled (excluding fillets)",
        hsn_code: "0302",
        gst_rate_percent: 0,
        gst_type: "INTER",
        cgst_rate: 0.0,
        sgst_rate: 0.0,
        igst_rate: 0.0,
        export_gst: 0.0,
        effective_from: effectiveFrom,
        effective_to: null,
        is_active: true,
        company_id: companyId,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      // RAW SEAFOOD - 5% GST
      {
        gst_rate_id: "0003-fish-frozen",
        gst_name: "Fish – frozen (non fillet)",
        hsn_code: "0303",
        gst_rate_percent: 5,
        gst_type: "INTRA",
        cgst_rate: 2.5,
        sgst_rate: 2.5,
        igst_rate: 5.0,
        export_gst: 0.0,
        effective_from: effectiveFrom,
        effective_to: null,
        is_active: true,
        company_id: companyId,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        gst_rate_id: "0004-fish-fillets",
        gst_name: "Fish fillets and minced meat (fresh or frozen)",
        hsn_code: "0304",
        gst_rate_percent: 5,
        gst_type: "INTRA",
        cgst_rate: 2.5,
        sgst_rate: 2.5,
        igst_rate: 5.0,
        export_gst: 0.0,
        effective_from: effectiveFrom,
        effective_to: null,
        is_active: true,
        company_id: companyId,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        gst_rate_id: "0005-fish-dried",
        gst_name: "Dried, salted or brined fish",
        hsn_code: "0305",
        gst_rate_percent: 5,
        gst_type: "INTRA",
        cgst_rate: 2.5,
        sgst_rate: 2.5,
        igst_rate: 5.0,
        export_gst: 0.0,
        effective_from: effectiveFrom,
        effective_to: null,
        is_active: true,
        company_id: companyId,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        gst_rate_id: "0006-crustaceans",
        gst_name: "Crustaceans (shrimp, prawns, lobster, crab) – fresh/frozen",
        hsn_code: "0306",
        gst_rate_percent: 5,
        gst_type: "INTRA",
        cgst_rate: 2.5,
        sgst_rate: 2.5,
        igst_rate: 5.0,
        export_gst: 0.0,
        effective_from: effectiveFrom,
        effective_to: null,
        is_active: true,
        company_id: companyId,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      // PROCESSED SEAFOOD - 12% GST
      {
        gst_rate_id: "0012-processed-seafood",
        gst_name: "Processed seafood products",
        hsn_code: "1604",
        gst_rate_percent: 12,
        gst_type: "INTRA",
        cgst_rate: 6.0,
        sgst_rate: 6.0,
        igst_rate: 12.0,
        export_gst: 0.0,
        effective_from: effectiveFrom,
        effective_to: null,
        is_active: true,
        company_id: companyId,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      // VALUE-ADDED PRODUCTS - 18% GST
      {
        gst_rate_id: "0018-value-added",
        gst_name: "Value-added seafood products",
        hsn_code: "1605",
        gst_rate_percent: 18,
        gst_type: "INTRA",
        cgst_rate: 9.0,
        sgst_rate: 9.0,
        igst_rate: 18.0,
        export_gst: 0.0,
        effective_from: effectiveFrom,
        effective_to: null,
        is_active: true,
        company_id: companyId,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
    ];

    // Insert GST master data with duplicate prevention
    for (const gstRecord of gstMasterData) {
      const existing = await queryInterface.sequelize.query(
        "SELECT id FROM consolidated_gst_master WHERE gst_rate_id = ? AND company_id = ?",
        {
          replacements: [gstRecord.gst_rate_id, gstRecord.company_id],
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (existing.length === 0) {
        await queryInterface.bulkInsert(
          "consolidated_gst_master",
          [gstRecord],
          {}
        );
      }
    }

    console.log(`Inserted ${gstMasterData.length} GST master records`);

    // ============================================================================
    // PHASE 2: CREATE PRODUCT GST MAPPINGS
    // ============================================================================

    console.log("Creating product GST mappings...");

    // Get GST masters
    const gstMasters = await queryInterface.sequelize.query(
      `
      SELECT id, gst_name, hsn_code, cgst_rate, sgst_rate, igst_rate
      FROM consolidated_gst_master
      WHERE is_active = true AND hsn_code IS NOT NULL
    `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Get products that need GST mapping
    const products = await queryInterface.sequelize.query(
      `
      SELECT id, hsn_code, product_name
      FROM product_master
      WHERE is_active = true AND hsn_code IS NOT NULL
      ORDER BY created_at
    `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    console.log(`Processing ${products.length} products for GST mapping`);

    // Create mappings in batches
    const batchSize = 1000;
    let processed = 0;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const mappings = [];

      for (const product of batch) {
        // Find matching GST master
        const gstMaster = gstMasters.find(
          (gst) => gst.hsn_code === product.hsn_code
        );

        if (gstMaster) {
          // Check if mapping already exists
          const existingMapping = await queryInterface.sequelize.query(
            "SELECT id FROM product_gst_mapping WHERE product_id = ? AND gst_master_id = ?",
            {
              replacements: [product.id, gstMaster.id],
              type: Sequelize.QueryTypes.SELECT,
            }
          );

          if (existingMapping.length === 0) {
            mappings.push({
              id: Sequelize.literal("gen_random_uuid()"),
              product_id: product.id,
              gst_master_id: gstMaster.id,
              effective_from: effectiveFrom,
              effective_to: null,
              is_active: true,
              created_by: systemUserId,
              updated_by: systemUserId,
              created_at: now,
              updated_at: now,
            });
          }
        }
      }

      if (mappings.length > 0) {
        await queryInterface.bulkInsert("product_gst_mapping", mappings, {});
        processed += mappings.length;
      }
    }

    console.log(`Created ${processed} product GST mappings`);
    console.log("Consolidated GST seeding completed successfully");
  },

  async down(queryInterface, Sequelize) {
    // Remove product GST mappings
    await queryInterface.bulkDelete(
      "product_gst_mapping",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );

    // Remove GST master records (only those created by this seeder)
    await queryInterface.bulkDelete(
      "consolidated_gst_master",
      {
        gst_rate_id: {
          [Sequelize.Op.in]: [
            "0001-raw-seafood",
            "0002-fish-fresh",
            "0003-fish-frozen",
            "0004-fish-fillets",
            "0005-fish-dried",
            "0006-crustaceans",
            "0012-processed-seafood",
            "0018-value-added",
          ],
        },
      },
      {}
    );
  },
};
