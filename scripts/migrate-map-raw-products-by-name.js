/**
 * Idempotent migration: Map raw products (no 4D mapping) to species by heuristic name matching.
 *
 * Logic:
 * 1. Load all active species with their names.
 * 2. Load all active raw products (species_derivative_size_grade_mapping_id IS NULL).
 * 3. For each species, find or create a product_category_master with that species_master_id.
 * 4. For each raw product, if its product_name contains a species name (case-insensitive),
 *    update product_master.product_category_master_id to that species' category.
 * 5. Idempotent: re-running applies only to products that don't yet have the correct category.
 *
 * Dry-run mode (default): show counts and examples without modifying DB.
 * Apply mode (--apply flag): actually update DB.
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

    // Load species
    const species = await sequelize.query(
      `SELECT id, species_name FROM species_master WHERE is_active = true ORDER BY id`,
      { type: QueryTypes.SELECT }
    );
    console.log(`Loaded ${species.length} species.\n`);

    // Load raw products (no 4D mapping)
    const rawProducts = await sequelize.query(
      `SELECT id, product_name, product_category_master_id 
       FROM product_master 
       WHERE is_active = true AND species_derivative_size_grade_mapping_id IS NULL
       ORDER BY id`,
      { type: QueryTypes.SELECT }
    );
    console.log(`Loaded ${rawProducts.length} raw products (no 4D mapping).\n`);

    // Build lowercase species index for quick lookup
    const speciesIndex = species.map((s) => ({
      id: s.id,
      name: s.species_name,
      lc: (s.species_name || "").toLowerCase(),
    }));

    // Step 1: Build or fetch categories for each species
    console.log("Step 1: Ensure each species has a product_category_master...");
    const speciesCategoryMap = {}; // species_id -> category_id

    for (const sp of species) {
      const [existing] = await sequelize.query(
        `SELECT id FROM product_category_master 
         WHERE species_master_id = :speciesId AND is_active = true
         LIMIT 1`,
        { replacements: { speciesId: sp.id }, type: QueryTypes.SELECT }
      );

      if (existing) {
        speciesCategoryMap[sp.id] = existing.id;
      } else {
        // Create a new category for this species
        const categoryId = require("uuid").v4();
        const categoryName = `${sp.species_name} - Raw`;
        await sequelize.query(
          `INSERT INTO product_category_master (id, category_name, species_master_id, is_active, created_at, updated_at)
           VALUES (:id, :name, :speciesId, true, now(), now())`,
          {
            replacements: {
              id: categoryId,
              name: categoryName,
              speciesId: sp.id,
            },
          }
        );
        speciesCategoryMap[sp.id] = categoryId;
        console.log(`  ✓ Created category: "${categoryName}"`);
      }
    }
    console.log(`\n✓ All ${species.length} species have categories.\n`);

    // Step 2: Build match list
    console.log(
      "Step 2: Identify matches (product_name contains species_name)..."
    );
    const matchesBySpecies = {};
    const unmatched = [];

    for (const product of rawProducts) {
      const pn = (product.product_name || "").toLowerCase();
      let matched = null;

      // Find first species name that appears in product name
      for (const sp of speciesIndex) {
        if (sp.lc && pn.includes(sp.lc)) {
          matched = sp;
          break;
        }
      }

      if (matched) {
        matchesBySpecies[matched.id] = matchesBySpecies[matched.id] || {
          species_name: matched.name,
          category_id: speciesCategoryMap[matched.id],
          count: 0,
          examples: [],
        };
        matchesBySpecies[matched.id].count++;
        if (matchesBySpecies[matched.id].examples.length < 3) {
          matchesBySpecies[matched.id].examples.push({
            product_id: product.id,
            product_name: product.product_name,
            current_category_id: product.product_category_master_id,
          });
        }
      } else {
        unmatched.push({
          product_id: product.id,
          product_name: product.product_name,
        });
      }
    }

    // Print match summary
    const matched = Object.values(matchesBySpecies).reduce(
      (sum, m) => sum + m.count,
      0
    );
    console.log(
      `Matched by name: ${matched} / ${rawProducts.length} products\n`
    );

    console.log("Match breakdown (species_id, species_name, count):\n");
    const matchList = Object.entries(matchesBySpecies)
      .map(([id, m]) => ({
        species_id: id.substring(0, 8) + "...",
        species_name: m.species_name,
        count: m.count,
      }))
      .sort((a, b) => b.count - a.count);
    console.table(matchList);

    console.log(`\nTop 5 matches with examples:\n`);
    for (const [speciesId, matchData] of Object.entries(matchesBySpecies)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)) {
      console.log(
        `Species: ${matchData.species_name} — ${matchData.count} products\n`
      );
      console.table(
        matchData.examples.map((ex) => ({
          product_name: ex.product_name,
          product_id: ex.product_id.substring(0, 8) + "...",
        }))
      );
    }

    if (unmatched.length > 0) {
      console.log(`\nUnmatched: ${unmatched.length} products\n`);
      console.log("Sample unmatched products:\n");
      console.table(
        unmatched.slice(0, 10).map((u) => ({
          product_name: u.product_name,
          product_id: u.product_id.substring(0, 8) + "...",
        }))
      );
    }

    // Step 3: If DRY_RUN, summarize and exit; else apply changes
    if (DRY_RUN_MODE) {
      console.log("\n========== DRY-RUN MODE ==========");
      console.log(`Would update ${matched} product_master rows.`);
      console.log(`Would leave ${unmatched.length} products unmatched.`);
      console.log("\nRun with --apply flag to apply changes:\n");
      console.log(
        "  node scripts/migrate-map-raw-products-by-name.js --apply\n"
      );
      await sequelize.close();
      process.exit(0);
    }

    // APPLY MODE
    console.log("\n========== APPLY MODE ==========\n");
    console.log("Applying updates...\n");

    let totalUpdated = 0;
    for (const [speciesId, matchData] of Object.entries(matchesBySpecies)) {
      const speciesLc = matchData.species_name.toLowerCase();
      const categoryId = matchData.category_id;

      // Update products whose name contains this species and aren't yet in the correct category
      const [result] = await sequelize.query(
        `UPDATE product_master 
         SET product_category_master_id = :categoryId, updated_at = now()
         WHERE is_active = true 
         AND species_derivative_size_grade_mapping_id IS NULL
         AND LOWER(product_name) LIKE CONCAT('%', :speciesName, '%')
         AND product_category_master_id != :categoryId`,
        {
          replacements: {
            categoryId,
            speciesName: speciesLc,
          },
        }
      );

      const rowsAffected = result.rowCount || 0;
      totalUpdated += rowsAffected;
      if (rowsAffected > 0) {
        console.log(
          `✓ ${matchData.species_name}: updated ${rowsAffected} products`
        );
      }
    }

    console.log(`\n✓ Total products updated: ${totalUpdated}`);
    console.log("\nVerifying...\n");

    // Post-update verification
    const verifyMapped = await sequelize.query(
      `SELECT COUNT(*)::int AS mapped_now FROM product_master 
       WHERE is_active = true AND species_derivative_size_grade_mapping_id IS NULL
       AND product_category_master_id IN (
         SELECT id FROM product_category_master WHERE species_master_id IS NOT NULL AND is_active = true
       )`,
      { type: QueryTypes.SELECT }
    );

    const verifyUnmapped = await sequelize.query(
      `SELECT COUNT(*)::int AS still_unmapped FROM product_master 
       WHERE is_active = true AND species_derivative_size_grade_mapping_id IS NULL
       AND product_category_master_id NOT IN (
         SELECT id FROM product_category_master WHERE species_master_id IS NOT NULL AND is_active = true
       )`,
      { type: QueryTypes.SELECT }
    );

    console.log("After update:");
    console.log(
      `  - Raw products now in species categories: ${
        verifyMapped[0]?.mapped_now || 0
      }`
    );
    console.log(
      `  - Raw products still unmatched: ${
        verifyUnmapped[0]?.still_unmapped || 0
      }`
    );

    await sequelize.close();
    console.log("\n✓ Migration complete.\n");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

main();
