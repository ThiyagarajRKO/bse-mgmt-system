#!/usr/bin/env node

/**
 * Run Product Master Seeder Only
 *
 * This script runs ONLY product-related seeders without running all seeders
 *
 * Usage:
 *   node scripts/run-product-master-seeder.js
 *
 * This runs in order:
 * 1. Base data seeder (species, categories, sizes, grades)
 * 2. Product generation seeder (from 4D mappings)
 * 3. Product GST mapping seeder
 */

const Sequelize = require("sequelize");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_SECRET,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false, // Set to console.log for debugging
  }
);

const seedersDir = path.join(__dirname, "../seeders");

// Product-related seeders in execution order
const PRODUCT_SEEDERS = [
  // Base product data - SKIP: Products and species already exist
  // "20251201-consolidated-product-master-seeder.js",

  // Generate products from 4D mappings (processed + raw)
  "20260109-generate-products-from-mappings.js",

  // Tax and GST mappings
  "20251212000000-seed-all-product-gst-mappings.js",
  "20251206000001-product-taxcode-gst-mapping.js",
];

async function runProductMasterSeeders() {
  try {
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("🌱 Running Product Master Seeders Only");
    console.log("═══════════════════════════════════════════════════════\n");

    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established\n");

    let successCount = 0;
    let errorCount = 0;

    // Run each seeder
    for (const seederFile of PRODUCT_SEEDERS) {
      const fullPath = path.join(seedersDir, seederFile);

      if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  Seeder not found: ${seederFile}`);
        continue;
      }

      try {
        console.log(`⏳ Running: ${seederFile}`);
        const seeder = require(fullPath);

        if (seeder.up) {
          await seeder.up(sequelize.getQueryInterface(), Sequelize);
          console.log(`✅ Success: ${seederFile}\n`);
          successCount++;
        } else {
          console.log(`⚠️  No 'up' function found in: ${seederFile}\n`);
        }
      } catch (error) {
        console.error(`❌ Error in ${seederFile}:`);
        console.error(error.message);
        console.log("\n");
        errorCount++;

        // Continue with next seeder instead of stopping
        // Uncomment to stop on first error:
        // throw error;
      }
    }

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("📊 Seeding Summary:");
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Total: ${successCount + errorCount}`);
    console.log("═══════════════════════════════════════════════════════\n");

    if (errorCount === 0) {
      console.log("🎉 Product Master Seeders Completed Successfully!\n");
    } else {
      console.log("⚠️  Some seeders failed. Please check the errors above.\n");
    }

    process.exit(errorCount === 0 ? 0 : 1);
  } catch (error) {
    console.error("\n❌ Seeding failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runProductMasterSeeders();
