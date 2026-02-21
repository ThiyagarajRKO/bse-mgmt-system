#!/usr/bin/env node

/**
 * Script to check HSN code population status in product_master
 * Run: node scripts/check-hsn.js
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const db = require("../models");

(async () => {
  let sequelize = null;
  try {
    // Authenticate DB connection
    await db.authenticate();
    sequelize = db.sequelize;

    console.log("\n========== HSN CODE POPULATION CHECK ==========\n");

    // 1. Count products with NULL or empty HSN
    const missingCount = await db.ProductMaster.count({
      where: sequelize.where(
        sequelize.fn(
          "COALESCE",
          sequelize.col('"ProductMaster"."hsn_code"'),
          "",
        ),
        "=",
        "",
      ),
    });

    const totalCount = await db.ProductMaster.count({
      paranoid: false, // Include soft-deleted
    });

    const presentCount = totalCount - missingCount;

    console.log(`Total products: ${totalCount}`);
    console.log(`Products WITH HSN codes: ${presentCount}`);
    console.log(`Products MISSING HSN codes: ${missingCount}`);
    console.log(
      `Coverage: ${((presentCount / totalCount) * 100).toFixed(2)}%\n`,
    );

    // 2. Sample products missing HSN
    if (missingCount > 0) {
      console.log("Sample products MISSING HSN (first 10):");
      const samples = await db.ProductMaster.findAll({
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
            attributes: ["species_name", "hsn_code"],
            required: false,
          },
        ],
        limit: 10,
        paranoid: true,
      });

      samples.forEach((prod, idx) => {
        const speciesHsn = prod.SpeciesMaster?.hsn_code || "N/A";
        console.log(
          `  ${idx + 1}. ${prod.product_name || "N/A"} (ID: ${prod.id})`,
        );
        console.log(`     - Product ID: ${prod.product_id}`);
        console.log(`     - Current HSN: NULL/EMPTY`);
        console.log(`     - Species HSN available: ${speciesHsn}\n`);
      });
    }

    // 3. Show products with HSN
    const withHsn = await db.ProductMaster.findAll({
      where: {
        [db.Sequelize.Op.and]: [
          sequelize.where(
            sequelize.fn(
              "COALESCE",
              sequelize.col('"ProductMaster"."hsn_code"'),
              "",
            ),
            "!=",
            "",
          ),
        ],
      },
      attributes: ["id", "product_name", "hsn_code"],
      limit: 5,
      paranoid: true,
    });

    if (withHsn.length > 0) {
      console.log("Sample products WITH HSN (first 5):");
      withHsn.forEach((prod, idx) => {
        console.log(
          `  ${idx + 1}. ${prod.product_name} - HSN: ${prod.hsn_code}`,
        );
      });
      console.log("");
    }

    console.log("========== END CHECK ==========\n");
  } catch (error) {
    console.error("Error during HSN check:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
    process.exit(0);
  }
})();
