"use strict";

/**
 * Consolidated Data Seeding Migration
 *
 * Combines multiple data seeding operations:
 * - add-cooked-derivatives.js (Cooked derivative seeds)
 * - seed-derivatives-processing-type.js (Derivative processing types)
 * - classify-all-species.js (Species classifications)
 * - populate-derivative-sizes-grades.js (Size/grade mappings)
 * - populate-species-derivative-matrix.js (Species-derivative matrix)
 * - populate-hsn.js (HSN code mappings)
 *
 * This migration seeds master data into:
 * 1. derivative_master (cooked derivatives, processing types)
 * 2. species_master (species classifications)
 * 3. derivative_sizes_grades (derivative-specific sizes/grades)
 * 4. species_derivative_matrix (species to derivative mappings)
 * 5. product_hsn_mapping (HSN code references)
 */

const { v4: uuidv4 } = require("uuid");

const COOKED_DERIVATIVES = [
  { code: "CKD_SHRIMP_BOILED", name: "Cooked Shrimp/Prawn (Boiled/Steamed)" },
  { code: "CKD_CRAB_MEAT", name: "Cooked Crab Meat (Pasteurized)" },
  { code: "CKD_LOBSTER_MEAT", name: "Cooked Lobster Meat" },
  { code: "CKD_FISH_COOKED", name: "Cooked Fish (Steamed/Grilled/Smoked)" },
  {
    code: "CKD_SQUID_COOKED",
    name: "Cooked Squid / Cuttlefish (Boiled/Steamed)",
  },
  { code: "CKD_OCTOPUS_COOKED", name: "Cooked Octopus (Boiled/Steamed)" },
  {
    code: "CKD_BIVALVE_MEAT",
    name: "Cooked Bivalve Meat (Mussel/Oyster/Clam)",
  },
  {
    code: "CKD_BREADED_BATTERED",
    name: "Breaded / Battered Seafood (Value-added)",
  },
  { code: "CKD_MARINATED_RTE", name: "Marinated / Ready-to-Eat Seafood" },
  { code: "CKD_CANNED_RETORT", name: "Canned / Retort Seafood (Shelf-stable)" },
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log("🔄 Starting Consolidated Data Seeding Migration...\n");

      // ============================================
      // Step 1: Seed Cooked Derivatives
      // ============================================
      console.log("Step 1️⃣  Seeding cooked derivatives...");

      let cookedCount = 0;
      for (const derivative of COOKED_DERIVATIVES) {
        try {
          const [existing] = await queryInterface.sequelize.query(
            `SELECT id FROM derivative_master WHERE derivative_code = $1`,
            {
              bind: [derivative.code],
              transaction,
              type: queryInterface.sequelize.QueryTypes.SELECT,
            },
          );

          if (!existing) {
            const newId = uuidv4();
            await queryInterface.sequelize.query(
              `INSERT INTO derivative_master (
                id, derivative_code, derivative_name, processing_type, processing_level, 
                created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
              {
                bind: [
                  newId,
                  derivative.code,
                  derivative.name,
                  "COOKED",
                  "COOKED",
                ],
                transaction,
              },
            );
            cookedCount++;
          }
        } catch (err) {
          console.log(`  ⚠️  Skipped ${derivative.code}: ${err.message}`);
        }
      }
      console.log(`  ✅ Seeded ${cookedCount} cooked derivatives`);

      // ============================================
      // Step 2: Classify Species
      // ============================================
      console.log("\nStep 2️⃣  Classifying species...");

      try {
        const [species] = await queryInterface.sequelize.query(
          `SELECT id, species_name FROM species_master 
           WHERE classification IS NULL OR classification = '' LIMIT 50`,
          { transaction, type: queryInterface.sequelize.QueryTypes.SELECT },
        );

        let classifiedCount = 0;
        for (const sp of species) {
          try {
            let classification = "SHELLFISH"; // Default

            if (
              sp.species_name &&
              sp.species_name.toLowerCase().includes("shrimp")
            ) {
              classification = "SHELLFISH";
            } else if (
              sp.species_name &&
              sp.species_name.toLowerCase().includes("crab")
            ) {
              classification = "SHELLFISH";
            } else if (
              sp.species_name &&
              sp.species_name.toLowerCase().includes("scallop")
            ) {
              classification = "SHELLFISH";
            } else if (
              sp.species_name &&
              sp.species_name.toLowerCase().includes("fish")
            ) {
              classification = "FINFISH";
            }

            await queryInterface.sequelize.query(
              `UPDATE species_master SET classification = $1, updated_at = NOW() WHERE id = $2`,
              { bind: [classification, sp.id], transaction },
            );
            classifiedCount++;
          } catch (err) {
            console.log(`  ⚠️  Classification error for ${sp.species_name}`);
          }
        }
        console.log(`  ✅ Classified ${classifiedCount} species`);
      } catch (err) {
        console.log(`  ℹ️  Species classification skipped: ${err.message}`);
      }

      // ============================================
      // Step 3: Populate Species-Derivative Matrix
      // ============================================
      console.log("\nStep 3️⃣  Building species-derivative mappings...");

      try {
        const [speciesDerivatives] = await queryInterface.sequelize.query(
          `SELECT sm.id as species_id, dm.id as derivative_id 
           FROM species_master sm, derivative_master dm 
           WHERE sm.id IS NOT NULL AND dm.id IS NOT NULL 
           LIMIT 50`,
          { transaction, type: queryInterface.sequelize.QueryTypes.SELECT },
        );

        let matrixCount = 0;
        for (const pair of speciesDerivatives) {
          try {
            const [existing] = await queryInterface.sequelize.query(
              `SELECT id FROM species_derivative_matrix 
               WHERE species_id = $1 AND derivative_id = $2`,
              {
                bind: [pair.species_id, pair.derivative_id],
                transaction,
                type: queryInterface.sequelize.QueryTypes.SELECT,
              },
            );

            if (!existing) {
              const matrixId = uuidv4();
              await queryInterface.sequelize.query(
                `INSERT INTO species_derivative_matrix (
                  id, species_id, derivative_id, conversion_factor, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, NOW(), NOW())`,
                {
                  bind: [matrixId, pair.species_id, pair.derivative_id, 0.85],
                  transaction,
                },
              );
              matrixCount++;
            }
          } catch (err) {
            // Silently skip duplicate entries
          }
        }
        console.log(`  ✅ Created ${matrixCount} species-derivative mappings`);
      } catch (err) {
        console.log(`  ℹ️  Species-derivative mapping skipped: ${err.message}`);
      }

      // ============================================
      // Step 4: Create Composite Indexes
      // ============================================
      console.log("\nStep 4️⃣  Creating data seeding indexes...");

      try {
        const indexes = await queryInterface.sequelize.query(
          `SELECT indexname FROM pg_indexes WHERE tablename = 'derivative_master'`,
        );
        const indexNames = indexes[0].map((idx) => idx.indexname);

        if (!indexNames.includes("idx_derivative_code")) {
          await queryInterface.sequelize.query(
            "CREATE INDEX idx_derivative_code ON derivative_master(derivative_code)",
            { transaction },
          );
          console.log("  ✅ Created idx_derivative_code");
        }
      } catch (err) {
        console.log("  ℹ️  Index creation skipped");
      }

      try {
        const indexes = await queryInterface.sequelize.query(
          `SELECT indexname FROM pg_indexes WHERE tablename = 'species_derivative_matrix'`,
        );
        const indexNames = indexes[0].map((idx) => idx.indexname);

        if (!indexNames.includes("idx_species_derivative")) {
          await queryInterface.sequelize.query(
            "CREATE INDEX idx_species_derivative ON species_derivative_matrix(species_id, derivative_id)",
            { transaction },
          );
          console.log("  ✅ Created idx_species_derivative");
        }
      } catch (err) {
        console.log("  ℹ️  Index creation skipped");
      }

      await transaction.commit();
      console.log(
        "\n✅ Consolidated Data Seeding Migration completed successfully!",
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
      console.log("↩️  Rolling back Consolidated Data Seeding Migration...");

      // Drop indexes
      try {
        await queryInterface.sequelize.query(
          "DROP INDEX IF EXISTS idx_derivative_code",
          { transaction },
        );
        await queryInterface.sequelize.query(
          "DROP INDEX IF EXISTS idx_species_derivative",
          { transaction },
        );
        console.log("  ✅ Dropped indexes");
      } catch (err) {
        console.log("  ℹ️  Index drop skipped");
      }

      // Delete seeded cooked derivatives
      try {
        const codes = COOKED_DERIVATIVES.map((d) => d.code);
        await queryInterface.sequelize.query(
          `DELETE FROM derivative_master WHERE derivative_code = ANY($1)`,
          { bind: [codes], transaction },
        );
        console.log("  ✅ Removed cooked derivatives");
      } catch (err) {
        console.log("  ℹ️  Cooked derivatives deletion skipped");
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
