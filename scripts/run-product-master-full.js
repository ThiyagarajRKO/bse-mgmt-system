#!/usr/bin/env node

/**
 * Run Product Master Migration AND Seeder
 *
 * This script runs ONLY product master migrations and seeders in the correct order
 *
 * Usage:
 *   node scripts/run-product-master-full.js
 *
 * Execution Order:
 * 1. Product Master Migrations (creates tables and schema)
 * 2. Product Master Seeders (populates data)
 */

const { spawn } = require("child_process");
const path = require("path");

async function runScript(scriptPath, scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Starting: ${scriptName}`);
    console.log("═".repeat(60));

    const child = spawn("node", [scriptPath], {
      stdio: "inherit",
      cwd: path.dirname(scriptPath),
    });

    child.on("exit", (code) => {
      if (code === 0) {
        console.log(`✅ ${scriptName} completed successfully`);
        resolve();
      } else {
        console.log(`❌ ${scriptName} failed with exit code ${code}`);
        reject(new Error(`${scriptName} failed`));
      }
    });

    child.on("error", (error) => {
      console.error(`❌ Error running ${scriptName}:`, error);
      reject(error);
    });
  });
}

async function runProductMasterFullSetup() {
  try {
    console.log("\n");
    console.log("╔═══════════════════════════════════════════════════════╗");
    console.log("║   🏭 PRODUCT MASTER - FULL MIGRATION & SEEDER SETUP   ║");
    console.log("╚═══════════════════════════════════════════════════════╝");

    const scriptsDir = path.join(__dirname);

    // Step 1: Run migrations
    await runScript(
      path.join(scriptsDir, "run-product-master-migration.js"),
      "Product Master Migrations"
    );

    // Step 2: Run seeders
    await runScript(
      path.join(scriptsDir, "run-product-master-seeder.js"),
      "Product Master Seeders"
    );

    console.log("\n");
    console.log("╔═══════════════════════════════════════════════════════╗");
    console.log("║   🎉 ALL PRODUCT MASTER SETUP COMPLETED SUCCESSFULLY! ║");
    console.log("╚═══════════════════════════════════════════════════════╝");
    console.log("\n✅ Your product master database is ready for use!\n");

    process.exit(0);
  } catch (error) {
    console.error("\n");
    console.error("╔═══════════════════════════════════════════════════════╗");
    console.error("║   ❌ PRODUCT MASTER SETUP FAILED                      ║");
    console.error("╚═══════════════════════════════════════════════════════╝");
    console.error("\nError:", error.message);
    process.exit(1);
  }
}

runProductMasterFullSetup();
