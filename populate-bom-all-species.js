#!/usr/bin/env node

/**
 * Standalone script to generate and populate BOMs for all species
 *
 * Run with: node populate-bom-all-species.js
 *
 * This script:
 * 1. Connects to the database
 * 2. Fetches all species, products, and derivatives
 * 3. Generates BOM structure using bom-generator
 * 4. Inserts all BOM data into database tables
 * 5. Verifies the data was inserted correctly
 */

require("dotenv").config();
const { Sequelize } = require("sequelize");
const bomGenerator = require("./scripts/bom-generator");

// Database configuration
const config = require("./config/config.js");

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

async function populateBomsForAllSpecies() {
  try {
    console.log("\n🚀 BOM Population Script Started\n");
    console.log("=".repeat(60));

    // Step 1: Connect to database
    console.log("\n📡 Connecting to database...");
    await sequelize.authenticate();
    console.log("✓ Database connection established\n");

    // Step 2: Fetch all species
    console.log("📊 Fetching species data...");
    const [species] = await sequelize.query(
      `SELECT id, species_name, species_code 
       FROM species_master 
       WHERE is_active = true AND deleted_at IS NULL
       ORDER BY species_name`
    );
    console.log(`✓ Found ${species.length} active species\n`);

    // List all species
    species.forEach((sp) => {
      console.log(`  • ${sp.species_name} (${sp.species_code})`);
    });

    // Step 3: Fetch all products
    console.log("\n📦 Fetching product data...");
    const [products] = await sequelize.query(
      `SELECT pm.id, pm.product_name, pm.is_active,
              pcm.product_category, pcm.species_master_id as species_id,
              sm.species_name, sm.species_code
       FROM product_master pm
       JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
       JOIN species_master sm ON pcm.species_master_id = sm.id
       WHERE pm.is_active = true AND pm.deleted_at IS NULL
       ORDER BY sm.species_name, pcm.product_category`
    );
    console.log(`✓ Found ${products.length} active products\n`);

    // Step 4: Fetch all derivatives
    console.log("🔄 Fetching derivative data...");
    const [derivatives] = await sequelize.query(
      `SELECT id, derivative_code, derivative_name
       FROM derivative_master
       WHERE is_active = true
       ORDER BY derivative_code`
    );
    console.log(`✓ Found ${derivatives.length} derivative types\n`);

    // Step 5: Generate BOM data
    console.log("📐 Generating BOM structure...");
    const bomData = bomGenerator.generateBomSQL(species, products, derivatives);
    console.log(
      `✓ Generated:\n` +
        `    • ${bomData.bom_master.length} BOM master records\n` +
        `    • ${bomData.bom_input.length} raw material mappings\n` +
        `    • ${bomData.bom_output.length} derivative outputs\n` +
        `    • ${bomData.derivative_grade_size_rule.length} grade/size rules\n`
    );

    // Step 6: Check for existing BOMs
    console.log("🔍 Checking for existing BOMs...");
    const [existingBoms] = await sequelize.query(
      `SELECT COUNT(*) as count FROM bom_master`
    );
    const existingCount = existingBoms[0]?.count || 0;

    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing BOM records`);
      console.log(
        "   Continuing will add new BOMs alongside existing ones...\n"
      );
    } else {
      console.log("✓ No existing BOMs found, fresh start\n");
    }

    // Step 7: Insert BOM master
    console.log("💾 Inserting BOM master records...");
    let inserted = 0;
    for (const bom of bomData.bom_master) {
      await sequelize.query(
        `INSERT INTO bom_master (id, species_id, bom_code, bom_name, input_uom, output_uom, is_active, created_at, updated_at) 
         VALUES (:id, :species_id, :bom_code, :bom_name, :input_uom, :output_uom, :is_active, NOW(), NOW())`,
        {
          replacements: bom,
          logging: false,
        }
      );
      inserted++;
      process.stdout.write(
        `\r  Progress: ${inserted}/${bomData.bom_master.length}`
      );
    }
    console.log(`\n✓ Inserted ${inserted} BOM master records\n`);

    // Step 8: Insert BOM inputs
    console.log("💾 Inserting raw material mappings...");
    inserted = 0;
    for (const input of bomData.bom_input) {
      await sequelize.query(
        `INSERT INTO bom_input (id, bom_id, raw_product_id, quantity, uom, created_at, updated_at)
         VALUES (:id, :bom_id, :raw_product_id, :quantity, :uom, NOW(), NOW())`,
        {
          replacements: input,
          logging: false,
        }
      );
      inserted++;
      process.stdout.write(
        `\r  Progress: ${inserted}/${bomData.bom_input.length}`
      );
    }
    console.log(`\n✓ Inserted ${inserted} raw material mappings\n`);

    // Step 9: Insert BOM outputs
    console.log("💾 Inserting derivative outputs with yields...");
    inserted = 0;
    for (const output of bomData.bom_output) {
      await sequelize.query(
        `INSERT INTO bom_output (id, bom_id, derivative_code, product_id, base_yield_percent, loss_type, created_at, updated_at)
         VALUES (:id, :bom_id, :derivative_code, :product_id, :base_yield_percent, :loss_type, NOW(), NOW())`,
        {
          replacements: output,
          logging: false,
        }
      );
      inserted++;
      process.stdout.write(
        `\r  Progress: ${inserted}/${bomData.bom_output.length}`
      );
    }
    console.log(`\n✓ Inserted ${inserted} derivative outputs\n`);

    // Step 10: Insert grade/size rules
    console.log("💾 Inserting grade/size yield multipliers...");
    inserted = 0;
    for (const rule of bomData.derivative_grade_size_rule) {
      await sequelize.query(
        `INSERT INTO derivative_grade_size_rule (id, species_id, derivative_code, size_min_grams, size_max_grams, allowed_grades, yield_multiplier, created_at, updated_at)
         VALUES (:id, :species_id, :derivative_code, :size_min_grams, :size_max_grams, :allowed_grades, :yield_multiplier, NOW(), NOW())`,
        {
          replacements: rule,
          logging: false,
        }
      );
      inserted++;
      process.stdout.write(
        `\r  Progress: ${inserted}/${bomData.derivative_grade_size_rule.length}`
      );
    }
    console.log(`\n✓ Inserted ${inserted} grade/size yield rules\n`);

    // Step 11: Verify data
    console.log("✅ Verifying inserted data...\n");
    const [bomCount] = await sequelize.query(
      `SELECT COUNT(*) as count FROM bom_master`
    );
    const [inputCount] = await sequelize.query(
      `SELECT COUNT(*) as count FROM bom_input`
    );
    const [outputCount] = await sequelize.query(
      `SELECT COUNT(*) as count FROM bom_output`
    );
    const [ruleCount] = await sequelize.query(
      `SELECT COUNT(*) as count FROM derivative_grade_size_rule`
    );

    console.log("Database verification:");
    console.log(
      `  • bom_master: ${bomCount[0]?.count || 0} records (after insertion)`
    );
    console.log(
      `  • bom_input: ${inputCount[0]?.count || 0} records (after insertion)`
    );
    console.log(
      `  • bom_output: ${outputCount[0]?.count || 0} records (after insertion)`
    );
    console.log(
      `  • derivative_grade_size_rule: ${
        ruleCount[0]?.count || 0
      } records (after insertion)\n`
    );

    // Step 12: Summary by species
    console.log("🎯 BOM Summary by Species:\n");
    const [bomsBySpecies] = await sequelize.query(
      `SELECT sm.species_name, COUNT(DISTINCT bm.id) as bom_count, COUNT(bo.id) as output_count
       FROM species_master sm
       LEFT JOIN bom_master bm ON sm.id = bm.species_id
       LEFT JOIN bom_output bo ON bm.id = bo.bom_id
       WHERE sm.is_active = true AND sm.deleted_at IS NULL
       GROUP BY sm.id, sm.species_name
       ORDER BY sm.species_name`
    );

    bomsBySpecies.forEach((row) => {
      if (row.bom_count > 0) {
        console.log(
          `  ✓ ${row.species_name}: ${row.bom_count} BOM(s) with ${row.output_count} derivatives`
        );
      } else {
        console.log(`  ○ ${row.species_name}: No BOMs (needs setup)`);
      }
    });

    console.log("\n" + "=".repeat(60));
    console.log("\n✅ BOM Population Complete!\n");
    console.log("Next steps:");
    console.log("  1. Rebuild the project: npm run build");
    console.log("  2. Restart the server: node dist");
    console.log("  3. Test inventory endpoint with any product");
    console.log("  4. Verify inventory flows through BOM for all species\n");
  } catch (error) {
    console.error("\n❌ Error during BOM population:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the script
populateBomsForAllSpecies();
