#!/usr/bin/env node

/**
 * Script to clear all records from size_master table and dependent tables
 * Usage: node scripts/clear-size-master.js
 */

require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_SECRET,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
  }
);

async function clearSizeMaster() {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Connected successfully\n");

    console.log("📊 Checking current size_master records...");
    const count = await sequelize.query(
      "SELECT COUNT(*) as count FROM size_master;",
      { type: Sequelize.QueryTypes.SELECT }
    );

    console.log(`   Current records: ${count[0].count}`);

    if (count[0].count > 0) {
      console.log(
        "\n⚠️  WARNING: About to delete all records from size_master"
      );
      console.log("   This action CANNOT be undone\n");

      // Use TRUNCATE with CASCADE to handle all FK dependencies
      console.log("🗑️  Truncating tables with CASCADE...");
      try {
        await sequelize.query(
          "TRUNCATE order_products, packing, product_master, species_derivative_size_grade_mapping, grade_size_mapping, size_master CASCADE;"
        );
        console.log(
          "✅ All records deleted successfully via TRUNCATE CASCADE\n"
        );
      } catch (truncateError) {
        // If CASCADE truncate fails, try selective deletion
        console.log("   ⚠️  TRUNCATE failed, attempting selective deletion...");
        console.log("🗑️  Deleting from order_products...");
        await sequelize.query("DELETE FROM order_products;").catch(() => {});

        console.log("🗑️  Deleting from packing...");
        await sequelize.query("DELETE FROM packing;").catch(() => {});

        console.log("🗑️  Deleting from product_master...");
        await sequelize.query("DELETE FROM product_master;").catch(() => {});

        console.log(
          "🗑️  Deleting from species_derivative_size_grade_mapping..."
        );
        await sequelize
          .query("DELETE FROM species_derivative_size_grade_mapping;")
          .catch(() => {});

        console.log("🗑️  Deleting from grade_size_mapping...");
        await sequelize
          .query("DELETE FROM grade_size_mapping;")
          .catch(() => {});

        // Finally delete from size_master
        console.log("🗑️  Deleting from size_master...");
        await sequelize.query("DELETE FROM size_master;").catch((e) => {
          throw new Error(`Failed to delete from size_master: ${e.message}`);
        });

        console.log(
          "✅ All records deleted successfully via selective deletion\n"
        );
      }

      // Verify deletion
      const newCount = await sequelize.query(
        "SELECT COUNT(*) as count FROM size_master;",
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(`📊 Records remaining in size_master: ${newCount[0].count}`);

      if (newCount[0].count === 0) {
        console.log("\n✅ size_master table has been cleared!");
      }
    } else {
      console.log("   No records to delete\n");
      console.log("✅ size_master table is already empty");
    }

    await sequelize.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

clearSizeMaster();
