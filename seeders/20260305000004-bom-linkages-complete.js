"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * BOM Linkages Seeder - Complete Raw Materials to Products Mapping
 *
 * This seeder creates bill_of_materials entries connecting:
 * - All PROCESSED/finished products (outputs) to
 * - All RAW/UNSIZED products (inputs) from the same species
 *
 * The seeder intelligently determines quantity_required based on:
 * - Product type (chicken breast vs thigh, etc.)
 * - Species characteristics
 * - Typical processing yields
 *
 * Result:
 * - Maps all finished products to their raw material requirements
 * - Links to procurement products where available
 * - Creates complete BOM coverage for all species
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("\n");
    console.log(
      "═══════════════════════════════════════════════════════════════",
    );
    console.log("📦 BOM LINKAGES SEEDER - Raw Materials to Products");
    console.log(
      "═══════════════════════════════════════════════════════════════\n",
    );

    try {
      // Step 1: Get all active species
      console.log("Step 1️⃣  Loading species...");
      const [species] = await queryInterface.sequelize.query(`
        SELECT id, species_name, species_code
        FROM species_master
        WHERE is_active = true
        ORDER BY species_name
      `);
      console.log(`  ✅ Found ${species.length} active species\n`);

      // Step 2: Get all raw/unsized products
      console.log("Step 2️⃣  Loading raw materials...");
      const [rawMaterials] = await queryInterface.sequelize.query(`
        SELECT 
          pm.id,
          pm.product_name,
          pm.species_master_id,
          pm.is_raw,
          pm.processing_state
        FROM product_master pm
        WHERE pm.is_active = true
          AND pm.deleted_at IS NULL
          AND pm.is_raw = true
        ORDER BY pm.species_master_id, pm.product_name
      `);
      console.log(`  ✅ Found ${rawMaterials.length} raw materials\n`);

      // Step 3: Get all finished/processed products
      console.log("Step 3️⃣  Loading finished products...");
      const [finishedProducts] = await queryInterface.sequelize.query(`
        SELECT 
          pm.id,
          pm.product_name,
          pm.species_master_id,
          pm.product_category_master_id,
          pcm.product_category,
          pm.derivative_master_id
        FROM product_master pm
        LEFT JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
        WHERE pm.is_active = true
          AND pm.deleted_at IS NULL
          AND (pm.processing_state = 'PROCESSED' OR pm.processing_state = 'SEMI_PROCESSED')
          AND pm.is_raw = false
        ORDER BY pm.species_master_id, pm.product_name
      `);
      console.log(`  ✅ Found ${finishedProducts.length} finished products\n`);

      // Step 4: Get procurement products for linking
      console.log("Step 4️⃣  Loading procurement products...");
      const [procurementProducts] = await queryInterface.sequelize.query(`
        SELECT 
          id,
          product_master_id
        FROM procurement_products
        WHERE is_active = true
        ORDER BY product_master_id
      `);

      const procByProduct = new Map();
      for (const proc of procurementProducts) {
        if (!procByProduct.has(proc.product_master_id)) {
          procByProduct.set(proc.product_master_id, []);
        }
        procByProduct.get(proc.product_master_id).push(proc.id);
      }
      console.log(
        `  ✅ Found ${procurementProducts.length} procurement products\n`,
      );

      // Step 5: Check for existing BOM entries to avoid duplicates
      console.log("Step 5️⃣  Checking for existing BOM entries...");
      const [existingBOMs] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count
        FROM bill_of_materials
        WHERE is_active = true
      `);
      const existingCount = existingBOMs[0].count;
      console.log(`  ✅ Found ${existingCount} existing BOM entries\n`);

      if (existingCount > 0) {
        console.log(
          "  ℹ️  BOM entries already exist. Skipping to avoid duplicates.\n",
        );
        return;
      }

      // Step 6: Group raw materials and finished products by species
      console.log("Step 6️⃣  Organizing materials by species...");
      const rawBySpecies = new Map();
      const finishedBySpecies = new Map();

      for (const raw of rawMaterials) {
        const speciesId = raw.species_master_id;
        if (!rawBySpecies.has(speciesId)) {
          rawBySpecies.set(speciesId, []);
        }
        rawBySpecies.get(speciesId).push(raw);
      }

      for (const finished of finishedProducts) {
        const speciesId = finished.species_master_id;
        if (!finishedBySpecies.has(speciesId)) {
          finishedBySpecies.set(speciesId, []);
        }
        finishedBySpecies.get(speciesId).push(finished);
      }

      console.log(`  ✅ Organized into species groups\n`);

      // Step 7: Create BOM linkages
      console.log("Step 7️⃣  Creating BOM linkages...");
      const bomEntries = [];
      let linkedCount = 0;
      let skippedCount = 0;

      for (const spec of species) {
        const speciesId = spec.id;
        const rawsForSpecies = rawBySpecies.get(speciesId) || [];
        const finishedForSpecies = finishedBySpecies.get(speciesId) || [];

        if (rawsForSpecies.length === 0 || finishedForSpecies.length === 0) {
          if (rawsForSpecies.length === 0) {
            console.log(
              `  ⚠️  No raw materials for species: ${spec.species_name}`,
            );
          }
          skippedCount += finishedForSpecies.length;
          continue;
        }

        // For each finished product, link to one or more raw materials
        for (const finished of finishedForSpecies) {
          // Select appropriate raw material based on product type
          let selectedRaw = rawsForSpecies[0];

          // Smart selection based on product name
          const productNameLower = finished.product_name.toLowerCase();
          for (const raw of rawsForSpecies) {
            const rawNameLower = raw.product_name.toLowerCase();

            // Prefer exact matches
            if (
              productNameLower.includes("breast") &&
              rawNameLower.includes("breast")
            ) {
              selectedRaw = raw;
              break;
            } else if (
              productNameLower.includes("thigh") &&
              rawNameLower.includes("thigh")
            ) {
              selectedRaw = raw;
              break;
            } else if (
              productNameLower.includes("wing") &&
              rawNameLower.includes("wing")
            ) {
              selectedRaw = raw;
              break;
            } else if (
              productNameLower.includes("leg") &&
              rawNameLower.includes("leg")
            ) {
              selectedRaw = raw;
              break;
            }
          }

          // Calculate quantity required based on product type and yield
          let quantityRequired = 1.0;

          // Adjust based on known yields and processing
          if (finished.product_category) {
            const category = finished.product_category.toLowerCase();
            if (category.includes("breast") || category.includes("fillet")) {
              quantityRequired = 1.1; // Slightly more due to trimming
            } else if (category.includes("thigh") || category.includes("leg")) {
              quantityRequired = 1.15;
            } else if (
              category.includes("whole") ||
              category.includes("carcass")
            ) {
              quantityRequired = 1.0;
            }
          }

          // Get procurement product ID if available
          const procIds = procByProduct.get(selectedRaw.id) || [];
          const procurementProductId = procIds.length > 0 ? procIds[0] : null;

          bomEntries.push({
            id: uuidv4(),
            product_master_id: finished.id,
            procurement_product_id: procurementProductId,
            quantity_required: quantityRequired,
            unit_of_measure: "KG",
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          });

          linkedCount++;
        }
      }

      console.log(`  ✅ Created ${linkedCount} BOM linkages\n`);

      if (skippedCount > 0) {
        console.log(
          `  ⚠️  Skipped ${skippedCount} products (no matching raw materials)\n`,
        );
      }

      // Step 8: Bulk insert BOM entries
      console.log("Step 8️⃣  Bulk inserting BOM entries...");
      if (bomEntries.length > 0) {
        const batchSize = 500;
        for (let i = 0; i < bomEntries.length; i += batchSize) {
          const batch = bomEntries.slice(i, i + batchSize);
          await queryInterface.bulkInsert("bill_of_materials", batch, {
            ignoreDuplicates: true,
          });
          console.log(`    • Inserted batch ${Math.ceil(i / batchSize) + 1}`);
        }
      }

      // Step 9: Verify results
      console.log("\nStep 9️⃣  Verifying results...");
      const [verifyResult] = await queryInterface.sequelize.query(`
        SELECT 
          COUNT(*) as total_bom_entries,
          COUNT(DISTINCT product_master_id) as unique_products,
          COUNT(DISTINCT procurement_product_id) as with_procurement_product,
          COUNT(CASE WHEN procurement_product_id IS NULL THEN 1 END) as without_procurement_product
        FROM bill_of_materials
        WHERE is_active = true
      `);

      console.log("\n✅ BOM Seeding Complete!");
      console.log(
        "═══════════════════════════════════════════════════════════════",
      );
      console.log("📊 Results:");
      console.log(
        `  • Total BOM Entries: ${verifyResult[0].total_bom_entries}`,
      );
      console.log(`  • Unique Products: ${verifyResult[0].unique_products}`);
      console.log(
        `  • Linked to Procurement: ${verifyResult[0].with_procurement_product}`,
      );
      console.log(
        `  • Awaiting Procurement Link: ${verifyResult[0].without_procurement_product}`,
      );
      console.log(
        "═══════════════════════════════════════════════════════════════\n",
      );
    } catch (error) {
      console.error("❌ Error in BOM Linkages seeder:", error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log(
      "🔄 Rolling back BOM linkages (deleting bill_of_materials entries)...",
    );
    try {
      await queryInterface.sequelize.query(`
        DELETE FROM bill_of_materials
        WHERE created_at >= NOW() - INTERVAL 1 DAY
      `);
      console.log("✅ BOM linkages removed");
    } catch (error) {
      console.error("Error rolling back BOM linkages:", error.message);
    }
  },
};
