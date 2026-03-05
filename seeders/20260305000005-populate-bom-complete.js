"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * BOM Complete Seeder - Populate bom_master, bom_input, and bom_output
 *
 * This seeder creates complete BOM structures with:
 * - bom_master: Species + derivative combinations (e.g., "Chicken Breast Processing")
 * - bom_input: Raw material inputs required for each BOM
 * - bom_output: Derivative product outputs with base yield percentages
 *
 * Example Structure:
 * BOM_CHICKEN_BREAST:
 *   INPUT: 1 KG Chicken (RAW)
 *   OUTPUT:
 *     - 0.90 KG Chicken Breast (RAW derivative)
 *     - 0.75 KG Chicken Breast (COOKED derivative) - 5% moisture loss
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("\n");
    console.log(
      "═══════════════════════════════════════════════════════════════",
    );
    console.log("📦 BOM COMPLETE SEEDER - Master + Input + Output");
    console.log(
      "═══════════════════════════════════════════════════════════════\n",
    );

    try {
      // Step 1: Get all species
      console.log("Step 1️⃣  Loading species...");
      const [allSpecies] = await queryInterface.sequelize.query(`
        SELECT id, species_name, species_code
        FROM species_master
        WHERE is_active = true
        ORDER BY species_name
      `);
      console.log(`  ✅ Found ${allSpecies.length} active species\n`);

      // Step 2: Get all derivatives
      console.log("Step 2️⃣  Loading derivatives...");
      const [allDerivatives] = await queryInterface.sequelize.query(`
        SELECT id, derivative_name, processing_type
        FROM derivative_master
        WHERE is_active = true
        ORDER BY derivative_name
      `);
      console.log(`  ✅ Found ${allDerivatives.length} derivatives\n`);

      // Step 3: Get all raw materials (inputs)
      console.log("Step 3️⃣  Loading raw materials...");
      const [rawMaterials] = await queryInterface.sequelize.query(`
        SELECT 
          id,
          species_master_id,
          product_name,
          is_raw,
          processing_state
        FROM product_master
        WHERE is_active = true
          AND deleted_at IS NULL
          AND is_raw = true
        ORDER BY species_master_id, product_name
      `);
      console.log(`  ✅ Found ${rawMaterials.length} raw materials\n`);

      // Step 4: Get all derivative products (outputs)
      console.log("Step 4️⃣  Loading derivative products...");
      const [derivativeProducts] = await queryInterface.sequelize.query(`
        SELECT 
          pm.id,
          pm.species_master_id,
          pm.derivative_master_id,
          pm.product_name,
          pm.processing_state,
          pm.is_raw,
          dm.processing_type
        FROM product_master pm
        LEFT JOIN derivative_master dm ON pm.derivative_master_id = dm.id
        WHERE pm.is_active = true
          AND pm.deleted_at IS NULL
          AND pm.derivative_master_id IS NOT NULL
          AND pm.is_raw = false
        ORDER BY pm.species_master_id, pm.derivative_master_id, pm.product_name
      `);
      console.log(
        `  ✅ Found ${derivativeProducts.length} derivative products\n`,
      );

      // Step 5: Check for existing BOM masters
      console.log("Step 5️⃣  Checking for existing BOM entries...");
      const [existingBOMs] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count
        FROM bom_master
        WHERE is_active = true
      `);
      const existingCount = existingBOMs[0].count;
      console.log(`  ✅ Found ${existingCount} existing BOM masters\n`);

      if (existingCount > 0) {
        console.log(
          "  ℹ️  BOM entries already exist. Skipping to avoid duplicates.\n",
        );
        return;
      }

      // Step 6: Organize materials by species and derivative
      console.log("Step 6️⃣  Organizing materials...");
      const rawBySpecies = new Map();
      const derivativesBySpeciesAndDerivative = new Map();

      for (const raw of rawMaterials) {
        const speciesId = raw.species_master_id;
        if (!rawBySpecies.has(speciesId)) {
          rawBySpecies.set(speciesId, []);
        }
        rawBySpecies.get(speciesId).push(raw);
      }

      for (const deriv of derivativeProducts) {
        const key = `${deriv.species_master_id}:${deriv.derivative_master_id}`;
        if (!derivativesBySpeciesAndDerivative.has(key)) {
          derivativesBySpeciesAndDerivative.set(key, []);
        }
        derivativesBySpeciesAndDerivative.get(key).push(deriv);
      }

      console.log(`  ✅ Organized into species-derivative groups\n`);

      // Step 7: Create BOM masters with inputs and outputs
      console.log("Step 7️⃣  Creating BOM structures...");
      const bomMasters = [];
      const bomInputs = [];
      const bomOutputs = [];

      let bomCount = 0;
      let inputCount = 0;
      let outputCount = 0;

      for (const species of allSpecies) {
        const speciesId = species.id;
        const speciesRaws = rawBySpecies.get(speciesId) || [];

        if (speciesRaws.length === 0) {
          console.log(
            `  ⚠️  No raw materials for species: ${species.species_name}`,
          );
          continue;
        }

        // For each raw material (input), create BOMs with all derivatives as outputs
        for (const raw of speciesRaws) {
          // Find all derivatives for this species
          for (const derivative of allDerivatives) {
            const key = `${speciesId}:${derivative.id}`;
            const derivativeProducts_ =
              derivativesBySpeciesAndDerivative.get(key) || [];

            if (derivativeProducts_.length === 0) {
              continue;
            }

            // Create BOM master
            const bomId = uuidv4();
            const bomCode = `BOM_${species.species_code}_${derivative.derivative_name.replace(/\s+/g, "_").toUpperCase()}`;
            const bomName = `${species.species_name} - ${derivative.derivative_name} Processing`;

            bomMasters.push({
              id: bomId,
              species_id: speciesId,
              bom_code: bomCode,
              bom_name: bomName,
              input_uom: "KG",
              output_uom: "KG",
              is_active: true,
              created_at: new Date(),
              updated_at: new Date(),
            });
            bomCount++;

            // Add BOM input (raw material)
            bomInputs.push({
              id: uuidv4(),
              bom_id: bomId,
              raw_product_id: raw.id,
              quantity: 1,
              uom: "KG",
              created_at: new Date(),
              updated_at: new Date(),
            });
            inputCount++;

            // Add BOM outputs (derivative products with yields)
            for (const product of derivativeProducts_) {
              // Determine yield based on processing type
              let baseYield = 0.9; // Default 90%

              if (derivative.processing_type === "RAW") {
                // Raw processing typically 75-95% yield
                baseYield = 0.9; // Conservative estimate
              } else if (derivative.processing_type === "COOKED") {
                // Cooked processing 5-15% less due to moisture loss
                baseYield = 0.75; // 75% (15% less than raw)
              } else if (derivative.processing_type === "DRIED") {
                // Dried products lose even more moisture
                baseYield = 0.6; // 60% yield
              } else if (derivative.processing_type === "FROZEN") {
                // Frozen similar to raw
                baseYield = 0.88;
              }

              // Fine-tune based on product category
              const productNameLower = product.product_name.toLowerCase();
              if (productNameLower.includes("breast")) {
                baseYield = derivative.processing_type === "RAW" ? 0.92 : 0.78;
              } else if (productNameLower.includes("fillet")) {
                baseYield = derivative.processing_type === "RAW" ? 0.88 : 0.73;
              } else if (productNameLower.includes("thigh")) {
                baseYield = derivative.processing_type === "RAW" ? 0.88 : 0.73;
              } else if (productNameLower.includes("wing")) {
                baseYield = derivative.processing_type === "RAW" ? 0.85 : 0.7;
              }

              bomOutputs.push({
                id: uuidv4(),
                bom_id: bomId,
                product_id: product.id,
                derivative_id: product.derivative_master_id,
                base_yield_pct: baseYield * 100, // Store as percentage (0-100)
                processing_type: product.processing_type || "RAW",
                is_active: true,
                created_at: new Date(),
                updated_at: new Date(),
              });
              outputCount++;
            }
          }
        }
      }

      console.log(
        `  ✅ Created ${bomCount} BOM masters, ${inputCount} inputs, ${outputCount} outputs\n`,
      );

      // Step 8: Insert BOM masters
      console.log("Step 8️⃣  Inserting BOM masters...");
      if (bomMasters.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < bomMasters.length; i += batchSize) {
          const batch = bomMasters.slice(i, i + batchSize);
          await queryInterface.bulkInsert("bom_master", batch, {
            ignoreDuplicates: true,
          });
          console.log(
            `    • Inserted batch ${Math.ceil(i / batchSize + 1)} (${batch.length} records)`,
          );
        }
      }

      // Step 9: Insert BOM inputs
      console.log("Step 9️⃣  Inserting BOM inputs...");
      if (bomInputs.length > 0) {
        const batchSize = 500;
        for (let i = 0; i < bomInputs.length; i += batchSize) {
          const batch = bomInputs.slice(i, i + batchSize);
          await queryInterface.bulkInsert("bom_input", batch, {
            ignoreDuplicates: true,
          });
          console.log(
            `    • Inserted batch ${Math.ceil(i / batchSize + 1)} (${batch.length} records)`,
          );
        }
      }

      // Step 10: Insert BOM outputs
      console.log("Step 🔟  Inserting BOM outputs...");
      if (bomOutputs.length > 0) {
        const batchSize = 1000;
        for (let i = 0; i < bomOutputs.length; i += batchSize) {
          const batch = bomOutputs.slice(i, i + batchSize);
          await queryInterface.bulkInsert("bom_output", batch, {
            ignoreDuplicates: true,
          });
          console.log(
            `    • Inserted batch ${Math.ceil(i / batchSize + 1)} (${batch.length} records)`,
          );
        }
      }

      // Step 11: Verify results
      console.log("\nStep 1️⃣1️⃣ Verifying results...");
      const [bomVerify] = await queryInterface.sequelize.query(`
        SELECT 
          COUNT(DISTINCT id) as total_boms,
          COUNT(DISTINCT species_id) as species_with_boms
        FROM bom_master
        WHERE is_active = true
      `);

      const [inputVerify] = await queryInterface.sequelize.query(`
        SELECT 
          COUNT(*) as total_inputs,
          COUNT(DISTINCT bom_id) as boms_with_inputs
        FROM bom_input
      `);

      const [outputVerify] = await queryInterface.sequelize.query(`
        SELECT 
          COUNT(*) as total_outputs,
          COUNT(DISTINCT bom_id) as boms_with_outputs,
          AVG(base_yield_pct) as avg_yield_pct
        FROM bom_output
        WHERE is_active = true
      `);

      console.log("\n✅ BOM Population Complete!");
      console.log(
        "═══════════════════════════════════════════════════════════════",
      );
      console.log("📊 Results:");
      console.log(`  • BOM Masters: ${bomVerify[0].total_boms}`);
      console.log(`  • Species Covered: ${bomVerify[0].species_with_boms}`);
      console.log(
        `  • BOM Inputs (Raw Materials): ${inputVerify[0].total_inputs}`,
      );
      console.log(`  • BOMs with Inputs: ${inputVerify[0].boms_with_inputs}`);
      console.log(
        `  • BOM Outputs (Derivative Products): ${outputVerify[0].total_outputs}`,
      );
      console.log(
        `  • BOMs with Outputs: ${outputVerify[0].boms_with_outputs}`,
      );
      console.log(
        `  • Average Yield: ${parseFloat(outputVerify[0].avg_yield_pct).toFixed(2)}%`,
      );
      console.log(
        "═══════════════════════════════════════════════════════════════\n",
      );
    } catch (error) {
      console.error("❌ Error in BOM Complete Seeder:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log("Removing BOM data...");
    await queryInterface.bulkDelete("bom_output", null, {});
    await queryInterface.bulkDelete("bom_input", null, {});
    await queryInterface.bulkDelete("bom_master", null, {});
    console.log("BOM data removed.");
  },
};
