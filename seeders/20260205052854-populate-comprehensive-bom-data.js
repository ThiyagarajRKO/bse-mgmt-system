"use strict";
const { v4: uuidv4 } = require("uuid");

/**
 * Comprehensive BOM Data Seeder
 *
 * This seeder populates both:
 * 1. New BOM system (bom_master, bom_input, bom_output tables)
 * 2. Legacy BOM system (bill_of_materials table)
 *
 * Run this seeder after the BOM tables migration to populate data.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("\n🚀 Starting Comprehensive BOM Data Population...\n");

    try {
      // ========== PHASE 1: POPULATE NEW BOM SYSTEM ==========
      console.log(
        "📋 PHASE 1: Populating new BOM system (bom_master, bom_input, bom_output)...\n",
      );

      // Get all active species
      const species = await queryInterface.sequelize.query(
        `SELECT id, species_name, species_code
         FROM species_master
         WHERE is_active = true AND deleted_at IS NULL
         ORDER BY species_name`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      console.log(`✓ Found ${species.length} active species`);

      // Get all active products grouped by species and category
      const products = await queryInterface.sequelize.query(
        `SELECT pm.id, pm.product_name, pm.is_active,
                pcm.product_category, pcm.species_master_id as species_id,
                sm.species_name, sm.species_code
         FROM product_master pm
         JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
         JOIN species_master sm ON pcm.species_master_id = sm.id
         WHERE pm.is_active = true AND pm.deleted_at IS NULL
         ORDER BY sm.species_name, pcm.product_category`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      console.log(`✓ Found ${products.length} active products`);

      // Get all derivatives
      let derivatives = [];
      try {
        const derivResults = await queryInterface.sequelize.query(
          `SELECT id, derivative_code, derivative_name
           FROM derivative_master
           WHERE is_active = true AND deleted_at IS NULL
           ORDER BY derivative_code`,
          { type: Sequelize.QueryTypes.SELECT },
        );
        derivatives = derivResults;
      } catch (err) {
        // Fallback: derivative_master might not have deleted_at column
        const derivResults = await queryInterface.sequelize.query(
          `SELECT id, derivative_code, derivative_name
           FROM derivative_master
           WHERE is_active = true
           ORDER BY derivative_code`,
          { type: Sequelize.QueryTypes.SELECT },
        );
        derivatives = derivResults;
      }

      console.log(`✓ Found ${derivatives.length} active derivatives\n`);

      // Populate BOM Master for each species
      let bomsCreated = 0;
      const bomMap = new Map(); // Map<species_id, bom_id>

      for (const sp of species) {
        const bomId = uuidv4();
        const bomCode = `BOM_${sp.species_code}`;
        const bomName = `Standard ${sp.species_name} Processing`;

        await queryInterface.sequelize.query(
          `INSERT INTO bom_master (id, species_id, bom_code, bom_name, input_uom, output_uom, is_active, created_at, updated_at)
           VALUES (:id, :species_id, :bom_code, :bom_name, :input_uom, :output_uom, :is_active, :created_at, :updated_at)
           ON CONFLICT (bom_code) DO NOTHING`,
          {
            replacements: {
              id: bomId,
              species_id: sp.id,
              bom_code: bomCode,
              bom_name: bomName,
              input_uom: "KG",
              output_uom: "KG",
              is_active: true,
              created_at: new Date(),
              updated_at: new Date(),
            },
          },
        );

        // Get the actual bom_id (in case it already existed)
        const existingBom = await queryInterface.sequelize.query(
          `SELECT id FROM bom_master WHERE bom_code = :bom_code`,
          {
            replacements: { bom_code: bomCode },
            type: Sequelize.QueryTypes.SELECT,
          },
        );

        if (existingBom.length > 0) {
          bomMap.set(sp.id, existingBom[0].id);
          bomsCreated++;
        }
      }

      console.log(`✓ Processed ${bomsCreated} BOMs (one per species)\n`);

      // ========== PHASE 2: ADD BOM OUTPUTS ==========
      console.log("📋 PHASE 2: Adding BOM outputs (derivatives)...\n");

      let outputsCreated = 0;

      // Standard yield percentages for derivatives
      const yieldMap = {
        TUBES: 15,
        TENTACLES: 25,
        RINGS: 18,
        MANTLE: 20,
        FINS: 8,
        WASTE: 14,
      };

      for (const [speciesId, bomId] of bomMap.entries()) {
        for (const deriv of derivatives) {
          const yieldPercent = yieldMap[deriv.derivative_code] || 10;

          // Find derivative product
          const derivProduct = products.find(
            (p) =>
              p.species_id === speciesId &&
              p.product_name.includes(deriv.derivative_code),
          );

          await queryInterface.sequelize.query(
            `INSERT INTO bom_output (id, bom_id, derivative_code, product_id, base_yield_percent, loss_type, created_at, updated_at)
             VALUES (:id, :bom_id, :derivative_code, :product_id, :base_yield_percent, :loss_type, :created_at, :updated_at)
             ON CONFLICT DO NOTHING`,
            {
              replacements: {
                id: uuidv4(),
                bom_id: bomId,
                derivative_code: deriv.derivative_code,
                product_id: derivProduct ? derivProduct.id : null,
                base_yield_percent: yieldPercent,
                loss_type: deriv.derivative_code === "WASTE" ? "WASTE" : "TRIM",
                created_at: new Date(),
                updated_at: new Date(),
              },
            },
          );

          outputsCreated++;
        }
      }

      console.log(`✓ Created ${outputsCreated} BOM outputs\n`);

      // ========== PHASE 3: ADD UNSIZED INPUTS ==========
      console.log("📋 PHASE 3: Adding UNSIZED inputs to BOMs...\n");

      // Get all UNSIZED raw products
      const unsizedProducts = await queryInterface.sequelize.query(
        `SELECT pm.id as product_id, pm.product_name, sm.species_name, sm.id as species_id
         FROM product_master pm
         JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
         JOIN species_master sm ON pcm.species_master_id = sm.id
         WHERE pm.product_name LIKE '%UNSIZED%'
         AND pm.product_name LIKE '%Raw%'
         AND pm.is_active = true
         AND pm.deleted_at IS NULL
         ORDER BY sm.species_name`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      console.log(`✓ Found ${unsizedProducts.length} UNSIZED raw products\n`);

      // Add UNSIZED inputs to all BOMs
      let inputsAdded = 0;

      for (const unsized of unsizedProducts) {
        const bomId = bomMap.get(unsized.species_id);

        if (bomId) {
          await queryInterface.sequelize.query(
            `INSERT INTO bom_input (id, bom_id, raw_product_id, quantity, uom, created_at, updated_at)
             VALUES (:id, :bom_id, :raw_product_id, :quantity, :uom, :created_at, :updated_at)
             ON CONFLICT DO NOTHING`,
            {
              replacements: {
                id: uuidv4(),
                bom_id: bomId,
                raw_product_id: unsized.product_id,
                quantity: 1.0,
                uom: "KG",
                created_at: new Date(),
                updated_at: new Date(),
              },
            },
          );

          inputsAdded++;
        }
      }

      console.log(`✓ Added ${inputsAdded} UNSIZED inputs to BOMs\n`);

      // ========== PHASE 4: POPULATE LEGACY BILL_OF_MATERIALS WITH ON-DEMAND PROCUREMENT CREATION ==========
      console.log(
        "📋 PHASE 4: Populating legacy bill_of_materials table with on-demand procurement creation...\n",
      );

      const now = new Date();

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
         LEFT JOIN species_derivative_size_grade_mapping sdsm ON pm.species_derivative_size_grade_mapping_id = sdsm.id
         LEFT JOIN derivative_master d ON pm.derivative_master_id = d.id
         WHERE pm.processing_state = 'PROCESSED'
         AND pm.is_active = true
         AND pm.deleted_at IS NULL`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      console.log(`✓ Found ${processedProducts.length} PROCESSED products`);

      // Pre-load existing procurement products
      const existingProcurementProducts = await queryInterface.sequelize.query(
        `SELECT pp.id, pp.product_master_id, pp.procurement_product_type
         FROM procurement_products pp
         WHERE pp.is_active = true`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      const procurementMap = {};
      for (const proc of existingProcurementProducts) {
        procurementMap[proc.product_master_id] = proc.id;
      }

      console.log(
        `✓ Found ${existingProcurementProducts.length} existing procurement products\n`,
      );

      // Get raw/unsized products that need procurement mappings - mapped by species_master_id
      const rawProducts = await queryInterface.sequelize.query(
        `SELECT pm.id, pm.product_name, sdsm.species_master_id
         FROM product_master pm
         LEFT JOIN species_derivative_size_grade_mapping sdsm ON pm.species_derivative_size_grade_mapping_id = sdsm.id
         WHERE (pm.processing_state != 'PROCESSED' OR pm.processing_state IS NULL)
         AND pm.is_active = true
         AND pm.deleted_at IS NULL
         AND (pm.product_name LIKE '%Raw%' OR pm.product_name LIKE '%UNSIZED%')`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      // Map raw products by species_master_id for quick lookup
      const rawProductsBySpecies = {};
      for (const raw of rawProducts) {
        if (!rawProductsBySpecies[raw.species_master_id]) {
          rawProductsBySpecies[raw.species_master_id] = [];
        }
        rawProductsBySpecies[raw.species_master_id].push(raw);
      }

      console.log(
        `✓ Found ${rawProducts.length} raw/unsized products for procurement mapping\n`,
      );

      // Create BOM linkages - only use existing procurement products
      const bomRows = [];
      let linkagesCreated = 0;
      let linkagesSkipped = 0;

      for (const processed of processedProducts) {
        // Find matching raw products based on species_master_id
        const rawsForSpecies =
          rawProductsBySpecies[processed.species_master_id];
        const matchingRaw = rawsForSpecies ? rawsForSpecies[0] : null;

        if (!matchingRaw) {
          linkagesSkipped++;
          continue;
        }

        // Check if procurement product exists for this raw material
        const procurementId = procurementMap[matchingRaw.id];

        if (!procurementId) {
          // No procurement product for this raw material - skip
          linkagesSkipped++;
          continue;
        }

        // Calculate quantity required based on yield
        const yieldPercent = processed.expected_yield_percent || 60;
        const quantityRequired = 100 / yieldPercent; // Inverse of yield

        bomRows.push({
          id: uuidv4(),
          product_master_id: processed.product_id,
          procurement_product_id: procurementId,
          quantity_required: quantityRequired,
          created_at: now,
          updated_at: now,
        });

        linkagesCreated++;
      }

      console.log(
        `✓ Created ${linkagesCreated} BOM linkages using existing procurement products`,
      );
      console.log(
        `⚠️  Skipped ${linkagesSkipped} products (no procurement product for raw material)\n`,
      );

      // Bulk insert BOM data
      if (bomRows.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < bomRows.length; i += batchSize) {
          const batch = bomRows.slice(i, i + batchSize);
          await queryInterface.bulkInsert("bill_of_materials", batch, {});
        }
      }

      console.log(
        `\n✅ Successfully populated bill_of_materials with ${bomRows.length} records\n`,
      );

      // ========== VERIFICATION ==========
      console.log("📊 VERIFICATION: Final counts\n");

      const bomCount = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM bom_master`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      const inputCount = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM bom_input`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      const outputCount = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM bom_output`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      const legacyBomCount = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM bill_of_materials`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      console.log(`✓ BOM Master Records: ${bomCount[0].count}`);
      console.log(`✓ BOM Input Records: ${inputCount[0].count}`);
      console.log(`✓ BOM Output Records: ${outputCount[0].count}`);
      console.log(`✓ Legacy BOM Records: ${legacyBomCount[0].count}\n`);

      console.log("✅ Comprehensive BOM Data Population Complete!\n");
    } catch (error) {
      console.error("❌ BOM Seeder failed:", error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log("\n🗑️  Reversing Comprehensive BOM Data Seeder...\n");

    try {
      // Clear legacy BOM data
      await queryInterface.sequelize.query(`DELETE FROM bill_of_materials`);

      // Clear new BOM data
      await queryInterface.sequelize.query(`DELETE FROM bom_cost`);
      await queryInterface.sequelize.query(`DELETE FROM bom_output`);
      await queryInterface.sequelize.query(`DELETE FROM bom_input`);
      await queryInterface.sequelize.query(`DELETE FROM bom_master`);

      console.log("✅ BOM data cleared successfully\n");
    } catch (error) {
      console.error("❌ BOM data cleanup failed:", error.message);
      throw error;
    }
  },
};
