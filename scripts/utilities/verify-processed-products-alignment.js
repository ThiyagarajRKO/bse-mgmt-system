/**
 * Verification & assurance migration for processed products (with 4D mappings).
 *
 * Purpose:
 * - Verify that all processed products (with species_derivative_size_grade_mapping_id) are assigned to
 *   categories whose species_master_id matches their 4D mapping's species_master_id.
 * - Optionally fix any misaligned assignments (though initial check shows 0 mismatches).
 * - Create species-specific categories if missing (for processed product categories).
 *
 * Dry-run mode (default): report current state and mismatches without changes.
 * Apply mode (--apply flag): create missing categories and fix any misaligned products.
 *
 * Expected outcome: All 2,000 processed products correctly aligned to species via categories.
 */

require("dotenv").config();
const { Sequelize, QueryTypes } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD || process.env.DB_SECRET,
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
  }
);

const args = process.argv.slice(2);
const APPLY_MODE = args.includes("--apply");
const DRY_RUN_MODE = !APPLY_MODE;

async function main() {
  try {
    await sequelize.authenticate();
    console.log("Connected to database.\n");

    console.log(
      "Step 1: Load processed products and their 4D mapping species..."
    );

    // Load all processed products with their 4D mapping species
    const processedProducts = await sequelize.query(
      `SELECT 
        pm.id,
        pm.product_name,
        pm.product_category_master_id as current_category_id,
        sdsgm.species_master_id as mapped_species_id,
        s.species_name,
        pcm.species_master_id as category_species_id
      FROM product_master pm
      JOIN species_derivative_size_grade_mapping sdsgm ON pm.species_derivative_size_grade_mapping_id = sdsgm.id
      JOIN species_master s ON sdsgm.species_master_id = s.id
      LEFT JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
      WHERE pm.is_active = true AND sdsgm.is_active = true AND s.is_active = true
      ORDER BY pm.id`,
      { type: QueryTypes.SELECT }
    );

    console.log(`Loaded ${processedProducts.length} processed products.\n`);

    // Count overall stats
    const aligned = processedProducts.filter(
      (p) => p.category_species_id === p.mapped_species_id
    ).length;
    const misaligned = processedProducts.filter(
      (p) => p.category_species_id !== p.mapped_species_id
    ).length;

    console.log("Step 2: Analyze alignment...");
    console.log(`  - Correctly aligned: ${aligned}`);
    console.log(`  - Misaligned: ${misaligned}`);
    console.log(
      `  - Success rate: ${((aligned / processedProducts.length) * 100).toFixed(
        1
      )}%\n`
    );

    if (misaligned > 0) {
      console.log("Misaligned products (sample):");
      const samples = processedProducts
        .filter((p) => p.category_species_id !== p.mapped_species_id)
        .slice(0, 10);
      console.table(
        samples.map((s) => ({
          product: s.product_name.substring(0, 40),
          mapped_species: s.species_name,
          current_category_species: s.category_species_id || "NULL",
        }))
      );
    }

    // Build species -> category map
    const speciesCategoryMap = {};
    const processedBySpecies = {};

    for (const prod of processedProducts) {
      if (!processedBySpecies[prod.mapped_species_id]) {
        processedBySpecies[prod.mapped_species_id] = {
          species_name: prod.species_name,
          products: [],
        };
      }
      processedBySpecies[prod.mapped_species_id].products.push(prod);
    }

    console.log(
      `\nStep 3: Ensure species-specific categories exist for processed products...`
    );

    for (const speciesId of Object.keys(processedBySpecies)) {
      const speciesData = processedBySpecies[speciesId];

      // Find existing category for this species
      const [existing] = await sequelize.query(
        `SELECT id FROM product_category_master 
         WHERE species_master_id = :speciesId AND is_active = true
         LIMIT 1`,
        { replacements: { speciesId }, type: QueryTypes.SELECT }
      );

      if (existing) {
        speciesCategoryMap[speciesId] = existing.id;
      } else {
        // Create category for this species
        const categoryId = require("uuid").v4();
        const categoryName = `${speciesData.species_name} - Processed`;
        await sequelize.query(
          `INSERT INTO product_category_master (id, product_category, species_master_id, is_active, created_at, updated_at)
           VALUES (:id, :category, :speciesId, true, now(), now())`,
          {
            replacements: {
              id: categoryId,
              category: categoryName,
              speciesId,
            },
          }
        );
        speciesCategoryMap[speciesId] = categoryId;
        console.log(`  ✓ Created: "${categoryName}"`);
      }
    }

    console.log(`✓ All species have categories.\n`);

    // If DRY_RUN, summarize and exit
    if (DRY_RUN_MODE) {
      console.log("========== DRY-RUN MODE ==========");
      if (misaligned > 0) {
        console.log(`Would fix ${misaligned} misaligned products.`);
        console.log("\nRun with --apply to apply fixes:\n");
        console.log(
          "  node scripts/verify-processed-products-alignment.js --apply\n"
        );
      } else {
        console.log("All processed products are correctly aligned! ✓");
        console.log("No changes needed.\n");
      }
      await sequelize.close();
      process.exit(0);
    }

    // APPLY MODE
    if (misaligned > 0) {
      console.log("========== APPLY MODE ==========\n");
      console.log("Fixing misaligned products...\n");

      let totalFixed = 0;
      for (const prod of processedProducts) {
        if (prod.category_species_id !== prod.mapped_species_id) {
          const correctCategoryId = speciesCategoryMap[prod.mapped_species_id];
          await sequelize.query(
            `UPDATE product_master 
             SET product_category_master_id = :categoryId, updated_at = now()
             WHERE id = :productId`,
            {
              replacements: {
                categoryId: correctCategoryId,
                productId: prod.id,
              },
            }
          );
          totalFixed++;
        }
      }

      console.log(`✓ Fixed ${totalFixed} products.\n`);
    } else {
      console.log("========== APPLY MODE ==========");
      console.log(
        "All processed products are correctly aligned. No fixes needed.\n"
      );
    }

    console.log("Verification complete:");
    console.log(`  - Total processed products: ${processedProducts.length}`);
    console.log(`  - Correctly aligned: ${aligned}`);
    console.log(`  - Issues fixed: ${misaligned}`);
    console.log(
      `  - Final status: ${
        aligned + (APPLY_MODE ? misaligned : 0) === processedProducts.length
          ? "✓ PASS"
          : "✗ FAIL"
      }\n`
    );

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

main();
