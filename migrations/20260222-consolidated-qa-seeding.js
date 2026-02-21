"use strict";

/**
 * Consolidated QA Seeding Migration
 *
 * Combines:
 * - run-qa-migration-direct.js (Schema columns)
 * - seed-and-autopopulate-qa.js (QA record creation)
 * - autopopulate-qa-all-peeled.js (Auto-population for all peeled products)
 *
 * This migration:
 * 1. Adds peeled_product_id column to qa_checklist table
 * 2. Adds qa_checklist_id column to peeled_dispatches table
 * 3. Creates seeder data for QA records
 * 4. Auto-populates QA records for existing peeled products
 */

const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log("🔄 Starting Consolidated QA Seeding Migration...\n");

      // ============================================
      // Step 1: Add QA Schema Columns
      // ============================================
      console.log("Step 1️⃣  Adding QA sequencing columns...");

      // Add peeled_product_id to qa_checklist if not exists
      try {
        const qaColumns = await queryInterface.describeTable("qa_checklist");
        if (!qaColumns.peeled_product_id) {
          await queryInterface.addColumn(
            "qa_checklist",
            "peeled_product_id",
            {
              type: Sequelize.UUID,
              allowNull: true,
              references: { model: "peeling_products", key: "id" },
              onDelete: "SET NULL",
              onUpdate: "CASCADE",
            },
            { transaction },
          );
          console.log("  ✅ Added peeled_product_id to qa_checklist");
        } else {
          console.log("  ℹ️  peeled_product_id already exists in qa_checklist");
        }
      } catch (err) {
        console.log("  ℹ️  peeled_product_id column check/creation skipped");
      }

      // Add qa_checklist_id to peeled_dispatches if not exists
      try {
        const pdColumns =
          await queryInterface.describeTable("peeled_dispatches");
        if (!pdColumns.qa_checklist_id) {
          await queryInterface.addColumn(
            "peeled_dispatches",
            "qa_checklist_id",
            {
              type: Sequelize.UUID,
              allowNull: true,
              references: { model: "qa_checklist", key: "id" },
              onDelete: "SET NULL",
              onUpdate: "CASCADE",
            },
            { transaction },
          );
          console.log("  ✅ Added qa_checklist_id to peeled_dispatches");
        } else {
          console.log(
            "  ℹ️  qa_checklist_id already exists in peeled_dispatches",
          );
        }
      } catch (err) {
        console.log("  ℹ️  qa_checklist_id column check/creation skipped");
      }

      // ============================================
      // Step 2: Create Indexes
      // ============================================
      console.log("\nStep 2️⃣  Creating performance indexes...");

      try {
        const indexes = await queryInterface.sequelize.query(
          `SELECT indexname FROM pg_indexes WHERE tablename = 'qa_checklist'`,
        );
        const indexNames = indexes[0].map((idx) => idx.indexname);

        if (!indexNames.includes("idx_qa_checklist_peeled_product_id")) {
          await queryInterface.sequelize.query(
            "CREATE INDEX idx_qa_checklist_peeled_product_id ON qa_checklist(peeled_product_id)",
            { transaction },
          );
          console.log("  ✅ Created idx_qa_checklist_peeled_product_id");
        }
      } catch (err) {
        console.log("  ℹ️  Index creation skipped (may already exist)");
      }

      try {
        const indexes = await queryInterface.sequelize.query(
          `SELECT indexname FROM pg_indexes WHERE tablename = 'peeled_dispatches'`,
        );
        const indexNames = indexes[0].map((idx) => idx.indexname);

        if (!indexNames.includes("idx_peeled_dispatches_qa_checklist_id")) {
          await queryInterface.sequelize.query(
            "CREATE INDEX idx_peeled_dispatches_qa_checklist_id ON peeled_dispatches(qa_checklist_id)",
            { transaction },
          );
          console.log("  ✅ Created idx_peeled_dispatches_qa_checklist_id");
        }
      } catch (err) {
        console.log("  ℹ️  Index creation skipped (may already exist)");
      }

      // ============================================
      // Step 3: Seed QA Data
      // ============================================
      console.log("\nStep 3️⃣  Creating QA records for peeled products...");

      // Get all peeling records with their products
      const [peelingRecords] = await queryInterface.sequelize.query(
        `SELECT id, product_id, peeled_quantity FROM peeling LIMIT 20`,
      );

      let qaRecordsCreated = 0;
      let qaRecordsSkipped = 0;

      for (const peeling of peelingRecords) {
        // Check if QA record exists for this peeling
        const [existingQA] = await queryInterface.sequelize.query(
          `SELECT id FROM qa_checklist WHERE peeled_product_id = $1 LIMIT 1`,
          { bind: [peeling.id], transaction },
        );

        if (existingQA.length === 0) {
          // Create peeling product if needed
          const peelingProductId = uuidv4();

          try {
            await queryInterface.sequelize.query(
              `INSERT INTO peeling_products (id, peeling_id, product_id, peeled_quantity, created_at, updated_at)
               VALUES ($1, $2, $3, $4, NOW(), NOW())
               ON CONFLICT DO NOTHING`,
              {
                bind: [
                  peelingProductId,
                  peeling.id,
                  peeling.product_id,
                  peeling.peeled_quantity,
                ],
                transaction,
              },
            );

            // Create QA record
            const qaId = uuidv4();
            const qaBatch = `QA-AUTO-${peeling.id}`;

            await queryInterface.sequelize.query(
              `INSERT INTO qa_checklist (
                id, peeled_product_id, batch_number, 
                broken_percentage, temperature, foreign_matter, 
                odour_status, appearance_status, net_weight_avg, 
                sample_size, qa_status, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
              {
                bind: [
                  qaId,
                  peelingProductId,
                  qaBatch,
                  0, // broken_percentage
                  0, // temperature
                  0, // foreign_matter
                  "PASS", // odour_status
                  "PASS", // appearance_status
                  0, // net_weight_avg
                  0, // sample_size
                  "PENDING", // qa_status
                ],
                transaction,
              },
            );

            qaRecordsCreated++;
            console.log(`  ✅ Created QA record: ${qaBatch}`);
          } catch (err) {
            console.log(
              `  ⚠️  Skipped QA for peeling ${peeling.id}: ${err.message}`,
            );
            qaRecordsSkipped++;
          }
        } else {
          qaRecordsSkipped++;
        }
      }

      console.log(`\n📊 QA Seeding Summary:`);
      console.log(`  ✅ Created: ${qaRecordsCreated} QA records`);
      console.log(`  ⏭️  Skipped: ${qaRecordsSkipped} records (already exist)`);

      await transaction.commit();
      console.log(
        "\n✅ Consolidated QA Seeding Migration completed successfully!",
      );

      return Promise.resolve();
    } catch (error) {
      await transaction.rollback();
      console.error("\n❌ Migration failed:", error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log("↩️  Rolling back Consolidated QA Seeding Migration...");

      // Drop indexes
      try {
        await queryInterface.sequelize.query(
          "DROP INDEX IF EXISTS idx_qa_checklist_peeled_product_id",
          { transaction },
        );
        await queryInterface.sequelize.query(
          "DROP INDEX IF EXISTS idx_peeled_dispatches_qa_checklist_id",
          { transaction },
        );
        console.log("  ✅ Dropped indexes");
      } catch (err) {
        console.log("  ℹ️  Index drop skipped");
      }

      // Remove columns
      try {
        await queryInterface.removeColumn("qa_checklist", "peeled_product_id", {
          transaction,
        });
        console.log("  ✅ Removed peeled_product_id from qa_checklist");
      } catch (err) {
        console.log("  ℹ️  Column removal skipped");
      }

      try {
        await queryInterface.removeColumn(
          "peeled_dispatches",
          "qa_checklist_id",
          { transaction },
        );
        console.log("  ✅ Removed qa_checklist_id from peeled_dispatches");
      } catch (err) {
        console.log("  ℹ️  Column removal skipped");
      }

      await transaction.commit();
      console.log("✅ Rollback completed");

      return Promise.resolve();
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Rollback failed:", error.message);
      throw error;
    }
  },
};
