#!/usr/bin/env node

/**
 * Direct QA Sequencing Migration - For Adding Columns Only
 * This doesn't wait for full table creation, just adds columns
 */

const Sequelize = require("sequelize");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function runMigration() {
  const sequelize = new Sequelize({
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_SECRET,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: console.log,
    pool: {
      max: 5,
      min: 1,
      idle: 10000,
      acquire: 30000,
    },
  });

  try {
    console.log("🔄 Starting QA Sequencing Migration...\n");

    await sequelize.authenticate();
    console.log("✅ Database connected\n");

    const qi = sequelize.getQueryInterface();

    // Use raw queries for more control
    console.log("Step 1️⃣  Adding peeled_product_id to qa_checklist...");

    try {
      // Check if column exists first
      const describeResult = await sequelize.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'qa_checklist' AND column_name = 'peeled_product_id';`,
      );

      if (describeResult[0].length === 0) {
        // Column doesn't exist, add it
        await sequelize.query(`
          ALTER TABLE qa_checklist 
          ADD COLUMN peeled_product_id UUID NULL
          REFERENCES peeling_products(id)
          ON DELETE SET NULL
          ON UPDATE CASCADE;
        `);
        console.log("  ✅ Added peeled_product_id column\n");

        // Add index
        await sequelize.query(`
          CREATE INDEX idx_qa_checklist_peeled_product_id 
          ON qa_checklist(peeled_product_id);
        `);
        console.log("  ✅ Created index idx_qa_checklist_peeled_product_id\n");
      } else {
        console.log("  ℹ️  peeled_product_id already exists\n");
      }
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log("  ℹ️  Column/index already exists\n");
      } else {
        throw err;
      }
    }

    // Step 2
    console.log("Step 2️⃣  Adding qa_checklist_id to peeled_dispatches...");

    try {
      const describeResult = await sequelize.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'peeled_dispatches' AND column_name = 'qa_checklist_id';`,
      );

      if (describeResult[0].length === 0) {
        // Column doesn't exist, add it
        await sequelize.query(`
          ALTER TABLE peeled_dispatches 
          ADD COLUMN qa_checklist_id UUID NULL
          REFERENCES qa_checklist(id)
          ON DELETE SET NULL
          ON UPDATE CASCADE;
        `);
        console.log("  ✅ Added qa_checklist_id column\n");

        // Add index
        await sequelize.query(`
          CREATE INDEX idx_peeled_dispatches_qa_checklist_id 
          ON peeled_dispatches(qa_checklist_id);
        `);
        console.log(
          "  ✅ Created index idx_peeled_dispatches_qa_checklist_id\n",
        );
      } else {
        console.log("  ℹ️  qa_checklist_id already exists\n");
      }
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log("  ℹ️  Column/index already exists\n");
      } else {
        throw err;
      }
    }

    // Verify
    console.log("Step 3️⃣  Final verification...");

    const qaCheckResult = await sequelize.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'qa_checklist' AND column_name = 'peeled_product_id';`,
    );

    const pdCheckResult = await sequelize.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'peeled_dispatches' AND column_name = 'qa_checklist_id';`,
    );

    if (qaCheckResult[0].length > 0) {
      console.log("  ✅ qa_checklist.peeled_product_id: PRESENT");
    } else {
      console.log("  ❌ qa_checklist.peeled_product_id: MISSING");
    }

    if (pdCheckResult[0].length > 0) {
      console.log("  ✅ peeled_dispatches.qa_checklist_id: PRESENT");
    } else {
      console.log("  ❌ peeled_dispatches.qa_checklist_id: MISSING");
    }

    if (qaCheckResult[0].length > 0 && pdCheckResult[0].length > 0) {
      console.log("\n✅ Migration completed successfully!\n");
      console.log("📊 Summary:");
      console.log("  • QA column structure updated");
      console.log("  • New foreign keys created");
      console.log("  • Performance indexes added");
      console.log(
        "\n✨ QA is now positioned between PeelingProducts and PeeledDispatches",
      );
    } else {
      console.log("\n⚠️  Some columns may still be missing");
    }

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Migration failed:", err.message);
    console.error("SQL:", err.sql);
    await sequelize.close();
    process.exit(1);
  }
}

runMigration();
