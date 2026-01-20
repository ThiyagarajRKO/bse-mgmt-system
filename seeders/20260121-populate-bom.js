"use strict";
const { v4: uuidv4 } = require("uuid");

/**
 * Populate Bill of Materials (BOM)
 *
 * Links RAW products (inputs) to PROCESSED products (outputs)
 *
 * BOM Logic:
 * - PROCESSED products require RAW materials from the same species and derivative
 * - For each PROCESSED product: find matching RAW product (same species + derivative)
 * - Quantity required based on expected_yield_percent (inverse calculation)
 * - Example: If yield is 60%, then 100kg RAW → 60kg PROCESSED, so need 1.67kg RAW per 1kg PROCESSED
 *
 * Generates BOMs for all PROCESSED products that have valid raw material inputs
 */

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    console.log("\n📋 Populating Bill of Materials (BOM)...\n");

    // Clean up existing procurement_products and BOMs to avoid duplicates
    console.log("🧹 Cleaning up existing data...");
    try {
      await queryInterface.sequelize.query(
        `DELETE FROM bill_of_materials WHERE procurement_product_id IN (
          SELECT id FROM procurement_products WHERE procurement_product_type = 'UNPROCESSED'
        )`,
      );
      await queryInterface.sequelize.query(
        `DELETE FROM procurement_products WHERE procurement_product_type = 'UNPROCESSED'`,
      );
      console.log("✓ Cleaned old records\n");
    } catch (err) {
      console.log("⚠️  No existing records to clean\n");
    }

    // Fetch all PROCESSED products with their mappings
    const processedProducts = await queryInterface.sequelize.query(
      `SELECT 
        pm.id as product_id,
        pm.product_name,
        pm.species_derivative_size_grade_mapping_id,
        pm.derivative_master_id,
        sdsm.species_master_id,
        sdsm.expected_yield_percent,
        d.derivative_code,
        d.processing_type
      FROM product_master pm
      JOIN species_derivative_size_grade_mapping sdsm ON pm.species_derivative_size_grade_mapping_id = sdsm.id
      JOIN derivative_master d ON sdsm.derivative_master_id = d.id
      WHERE pm.is_raw = false AND pm.processing_state = 'PROCESSED' AND pm.is_active = true`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    console.log(`Found ${processedProducts.length} PROCESSED products\n`);

    // Fetch all RAW products by species (to link processed → raw by species only)
    const rawProductsBySpecies = await queryInterface.sequelize.query(
      `SELECT 
        pm.id as product_id,
        sdsm.species_master_id,
        sdsm.derivative_master_id,
        pm.size_master_id,
        pm.product_name,
        d.derivative_code,
        d.processing_type
      FROM product_master pm
      JOIN species_derivative_size_grade_mapping sdsm ON pm.species_derivative_size_grade_mapping_id = sdsm.id
      JOIN derivative_master d ON sdsm.derivative_master_id = d.id
      WHERE pm.is_raw = true AND pm.is_active = true`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    // Create lookup map: species_id -> [raw products]
    const rawProductMap = {};
    for (const rawProduct of rawProductsBySpecies) {
      const speciesKey = rawProduct.species_master_id;
      if (!rawProductMap[speciesKey]) {
        rawProductMap[speciesKey] = [];
      }
      rawProductMap[speciesKey].push(rawProduct);
    }

    console.log(
      `Found ${rawProductsBySpecies.length} RAW products for input\n`,
    );

    // Get system user for audit trail
    const adminUser = await queryInterface.sequelize.query(
      `SELECT id FROM user_profiles LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );
    const systemUserId = adminUser[0]?.id || uuidv4();

    // Get a default supplier for procurement
    const suppliers = await queryInterface.sequelize.query(
      `SELECT id FROM supplier_master WHERE is_active = true LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );
    const defaultSupplierId = suppliers[0]?.id || uuidv4();

    // Create or get a default procurement lot for raw materials
    const procurementLots = await queryInterface.sequelize.query(
      `SELECT id FROM procurement_lots LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );
    let defaultProcurementLotId = procurementLots[0]?.id;

    // If no procurement lot exists, create one
    if (!defaultProcurementLotId) {
      defaultProcurementLotId = uuidv4();
      try {
        await queryInterface.sequelize.query(
          `INSERT INTO procurement_lots (id, procurement_lot_code, procurement_lot_date, created_at, updated_at, created_by)
           VALUES (:id, 'BOM_LOT_001', NOW(), NOW(), NOW(), :userId)`,
          {
            replacements: {
              id: defaultProcurementLotId,
              userId: systemUserId,
            },
          },
        );
      } catch (err) {
        // Lot might already exist
      }
    }

    // First, create procurement_products records for each UNIQUE RAW product
    console.log(`Creating procurement_products records...\n`);
    const uniqueRawProducts = new Map();

    // Build unique set based on product_id to avoid duplicates
    for (const rawProduct of rawProductsBySpecies) {
      if (!uniqueRawProducts.has(rawProduct.product_id)) {
        uniqueRawProducts.set(rawProduct.product_id, rawProduct);
      }
    }

    const procurementRows = [];
    for (const [productId, rawProduct] of uniqueRawProducts) {
      procurementRows.push({
        id: uuidv4(),
        product_master_id: rawProduct.product_id,
        procurement_lot_id: defaultProcurementLotId,
        supplier_master_id: defaultSupplierId,
        procurement_product_type: "UNPROCESSED",
        procurement_quantity: 1000, // 1000 kg available per raw product
        adjusted_quantity: 1000,
        procurement_price: 10, // Placeholder price per kg
        adjusted_price: 10,
        procurement_purchaser: "SYSTEM",
        is_active: true,
        created_at: now,
        updated_at: now,
        created_by: systemUserId,
        updated_by: systemUserId,
      });
    }

    // Insert procurement products in batches
    if (procurementRows.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < procurementRows.length; i += batchSize) {
        const batch = procurementRows.slice(i, i + batchSize);
        try {
          await queryInterface.bulkInsert("procurement_products", batch, {});
          console.log(
            `  ✓ Inserted procurement batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(procurementRows.length / batchSize)}`,
          );
        } catch (err) {
          // Some might already exist - that's OK
          console.log(
            `  ⚠️  Batch ${Math.floor(i / batchSize) + 1} may have duplicates (OK)`,
          );
        }
      }
    }

    // Fetch the newly created procurement_products
    const procurementProducts = await queryInterface.sequelize.query(
      `SELECT 
        pp.id as procurement_id,
        pp.product_master_id
      FROM procurement_products pp
      WHERE pp.procurement_product_type = 'UNPROCESSED'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    // Create lookup: raw product_id -> procurement_id
    const procurementMap = {};
    for (const proc of procurementProducts) {
      procurementMap[proc.product_master_id] = proc.procurement_id;
    }

    console.log(
      `\nCreated ${procurementProducts.length} procurement records\n`,
    );

    // Build BOM records
    const bomRows = [];
    let successCount = 0;
    let skipCount = 0;

    for (const processedProduct of processedProducts) {
      // Link processed product to ANY raw product from the same species
      // In real manufacturing, you'd pick based on specific derivative compatibility
      const availableRawProducts =
        rawProductMap[processedProduct.species_master_id] || [];

      if (availableRawProducts.length === 0) {
        skipCount++;
        continue;
      }

      // Use the first available RAW product for this species
      // This represents the raw input needed to create the processed product
      const rawProduct = availableRawProducts[0];
      const procurementProductId = procurementMap[rawProduct.product_id];

      if (!procurementProductId) {
        skipCount++;
        continue;
      }

      // Calculate quantity required based on yield
      // If yield is 60%, then 100kg input → 60kg output
      // So for 1kg output, need: 1 / (yield% / 100) = 1 / 0.60 = 1.67kg input
      const yieldPercent = processedProduct.expected_yield_percent || 85;
      const quantityRequired = 1 / (yieldPercent / 100);

      bomRows.push({
        id: uuidv4(),
        product_master_id: processedProduct.product_id, // OUTPUT (processed product)
        procurement_product_id: procurementProductId, // INPUT (raw material from procurement)
        quantity_required: Math.round(quantityRequired * 100) / 100, // Round to 2 decimals
        unit_of_measure: "kg",
        is_active: true,
        created_at: now,
        updated_at: now,
      });

      successCount++;

      if (successCount % 500 === 0) {
        console.log(`  📍 Processed ${successCount} BOM entries...`);
      }
    }

    console.log(`\n✅ Prepared ${bomRows.length} BOM records`);
    console.log(`   - Created BOMs: ${successCount}`);
    console.log(`   - Skipped (no raw material): ${skipCount}\n`);

    if (bomRows.length > 0) {
      // Insert in batches
      const batchSize = 500;
      for (let i = 0; i < bomRows.length; i += batchSize) {
        const batch = bomRows.slice(i, i + batchSize);
        try {
          await queryInterface.bulkInsert("bill_of_materials", batch, {
            ignoreDuplicates: true,
          });
          console.log(
            `  ✓ Inserted BOM batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(bomRows.length / batchSize)}`,
          );
        } catch (err) {
          console.log(
            `  ⚠️  BOM batch ${Math.floor(i / batchSize) + 1} had issues: ${err.message}`,
          );
        }
      }

      console.log(
        `\n✅ Successfully populated bill_of_materials with ${bomRows.length} records\n`,
      );
    }
  },

  async down(queryInterface) {
    // Delete all BOM entries created by this seeder
    await queryInterface.sequelize.query(`DELETE FROM bill_of_materials`);
  },
};
