#!/usr/bin/env node

/**
 * Script to populate missing HSN codes in product_master from species_master
 * Run: node scripts/populate-hsn.js [--dry-run]
 *
 * Options:
 *   --dry-run    Show what would be updated without making changes
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const db = require("../models");

const isDryRun = process.argv.includes("--dry-run");

(async () => {
  let sequelize = null;
  try {
    // Authenticate DB connection
    await db.authenticate();
    sequelize = db.sequelize;

    console.log("\n========== HSN CODE POPULATION ==========\n");
    if (isDryRun) {
      console.log("🔍 DRY RUN MODE - No changes will be made\n");
    }

    // 1. Find all products missing HSN
    const productsToUpdate = await db.ProductMaster.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { hsn_code: null },
          sequelize.where(
            sequelize.fn("TRIM", sequelize.col('"ProductMaster"."hsn_code"')),
            "=",
            "",
          ),
        ],
      },
      attributes: ["id", "product_name", "product_id", "species_master_id"],
      include: [
        {
          model: db.SpeciesMaster,
          attributes: ["id", "species_name", "hsn_code"],
          required: false,
        },
      ],
      paranoid: true,
    });

    console.log(
      `Found ${productsToUpdate.length} products missing HSN codes\n`,
    );

    if (productsToUpdate.length === 0) {
      console.log("✅ All products already have HSN codes! Nothing to do.\n");
      console.log("========== END POPULATION ==========\n");
      process.exit(0);
    }

    // 2. Categorize products by update possibility
    const canUpdate = [];
    const cannotUpdate = [];

    for (const product of productsToUpdate) {
      if (product.SpeciesMaster?.hsn_code) {
        canUpdate.push({
          product,
          speciesHsn: product.SpeciesMaster.hsn_code,
        });
      } else {
        cannotUpdate.push(product);
      }
    }

    console.log(`✓ Can update (species has HSN): ${canUpdate.length}`);
    console.log(`✗ Cannot update (no species HSN): ${cannotUpdate.length}\n`);

    // 3. Show samples of what will be updated
    if (canUpdate.length > 0) {
      console.log("Sample updates that will be applied (first 5):");
      canUpdate.slice(0, 5).forEach((item, idx) => {
        const { product, speciesHsn } = item;
        console.log(`  ${idx + 1}. ${product.product_name}`);
        console.log(`     - Product ID: ${product.product_id}`);
        console.log(`     - Species: ${product.SpeciesMaster.species_name}`);
        console.log(`     - New HSN: ${speciesHsn}\n`);
      });
    }

    if (cannotUpdate.length > 0) {
      console.log("Products that CANNOT be updated (missing species HSN):");
      cannotUpdate.slice(0, 5).forEach((product, idx) => {
        console.log(`  ${idx + 1}. ${product.product_name}`);
        console.log(`     - Product ID: ${product.product_id}`);
        console.log(
          `     - Species: ${product.SpeciesMaster?.species_name || "No species linked"}\n`,
        );
      });
      if (cannotUpdate.length > 5) {
        console.log(`  ... and ${cannotUpdate.length - 5} more\n`);
      }
    }

    // 4. Proceed with update if not dry-run
    if (isDryRun) {
      console.log(`\n📊 DRY RUN: Would update ${canUpdate.length} products\n`);
    } else {
      console.log(`\n⏳ Updating ${canUpdate.length} products...\n`);

      let updatedCount = 0;
      let errorCount = 0;

      for (const item of canUpdate) {
        const { product, speciesHsn } = item;
        try {
          await db.ProductMaster.update(
            { hsn_code: speciesHsn },
            {
              where: { id: product.id },
              hooks: false, // Skip beforeUpdate hooks to avoid regenerating product_name
            },
          );
          updatedCount++;
        } catch (err) {
          console.error(
            `✗ Error updating ${product.product_name}: ${err.message}`,
          );
          errorCount++;
        }
      }

      console.log(`\n✅ Successfully updated: ${updatedCount} products`);
      if (errorCount > 0) {
        console.log(`❌ Failed to update: ${errorCount} products`);
      }
    }

    console.log("\n========== END POPULATION ==========\n");
  } catch (error) {
    console.error("❌ Error during HSN population:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
    process.exit(0);
  }
})();
