#!/usr/bin/env node

/**
 * Run Product Master Migrations Only
 *
 * This script runs ONLY the consolidated product master migration (20260111-consolidated-product-master-schema.js)
 * without running all migrations
 *
 * Usage:
 *   node scripts/run-product-master-migration.js
 *
 * This runs in order:
 * 1. All prerequisite migrations (species, sizes, grades, etc.)
 * 2. Final consolidated product master migration
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
    logging: console.log,
  }
);

const migrationsDir = path.join(__dirname, "../migrations");

// Product master related migrations in order
const PRODUCT_MASTER_MIGRATIONS = [
  // Base tables needed first
  "20240328150019-create-species_master.js",
  "20240328150012-create-size_master.js",

  // Species and size mappings
  "20251202-create-species-size-mapping.js",
  "20251206000000-consolidated-species-product-master.js",

  // Consolidated product master (MAIN MIGRATION)
  "20260111-consolidated-product-master-schema.js",

  // Post product master migrations
  "20260108-create-derivative-master.js",
  "20260108-create-species-derivative-size-grade-mapping.js",
  "20260109-add-product-flags.js",
  "20260109-add-raw-product-support.js",

  // GST and Tax related migrations (required for seeding)
  "20251125-consolidated-gst-master-migration.js",
  "20251125000005-create-product-gst-mapping.js",
  "20251125173715-create-tax-code-master.js",
  "20251206000001-create-product-taxcode-gst-mapping.js",
  "20251211000000-consolidate-gst-mapping-schema.js",
];

async function runProductMasterMigrations() {
  try {
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("🚀 Running Product Master Migrations Only");
    console.log("═══════════════════════════════════════════════════════\n");

    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established\n");

    // Get list of already executed migrations
    const [migrations] = await sequelize.query(
      `SELECT name FROM "SequelizeMeta" ORDER BY name ASC`
    );
    const executedMigrations = new Set(migrations.map((m) => m.name));

    console.log(`📊 Already executed migrations: ${executedMigrations.size}\n`);

    let executedCount = 0;
    let skippedCount = 0;

    // Run each migration
    for (const migrationFile of PRODUCT_MASTER_MIGRATIONS) {
      const fullPath = path.join(migrationsDir, migrationFile);

      if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  Migration not found: ${migrationFile}`);
        continue;
      }

      if (executedMigrations.has(migrationFile)) {
        console.log(`⏭️  Already executed: ${migrationFile}`);
        skippedCount++;
        continue;
      }

      try {
        console.log(`⏳ Executing: ${migrationFile}`);
        const migration = require(fullPath);

        if (migration.up) {
          await migration.up(sequelize.getQueryInterface(), Sequelize);

          // Record in SequelizeMeta
          await sequelize.query(
            `INSERT INTO "SequelizeMeta" (name) VALUES ('${migrationFile}')`
          );

          console.log(`✅ Success: ${migrationFile}\n`);
          executedCount++;
        }
      } catch (error) {
        console.error(`❌ Error in ${migrationFile}:`);
        console.error(error.message);
        console.log("\n");
        throw error;
      }
    }

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("📊 Migration Summary:");
    console.log(`✅ Newly executed: ${executedCount}`);
    console.log(`⏭️  Already executed: ${skippedCount}`);
    console.log(`📝 Total: ${executedCount + skippedCount}`);
    console.log("═══════════════════════════════════════════════════════\n");

    console.log("🎉 Product Master Migrations Completed Successfully!\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runProductMasterMigrations();
