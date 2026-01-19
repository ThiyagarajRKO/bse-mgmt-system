#!/usr/bin/env node

/**
 * Apply sizes and grades to species_derivative_size_grade_mapping
 * Uses simple SQL updates with derivative-specific sizing logic
 */

const { Sequelize } = require("sequelize");
require("dotenv").config();

async function applySizesAndGrades() {
  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USERNAME,
    process.env.DB_SECRET,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: "postgres",
      logging: false,
    },
  );

  try {
    console.log(
      "Applying sizes and grades to species-derivative mappings...\n",
    );
    await sequelize.authenticate();

    // Get all necessary IDs upfront
    const [sizeData] = await sequelize.query(
      `SELECT id, size FROM size_master WHERE is_active = true`,
    );
    const [gradeData] = await sequelize.query(
      `SELECT id, grade_name FROM grade_master WHERE is_active = true`,
    );

    const sizes = Object.fromEntries(sizeData.map((s) => [s.size, s.id]));
    const grades = Object.fromEntries(
      gradeData.map((g) => [g.grade_name, g.id]),
    );

    console.log(
      `Found ${Object.keys(sizes).length} sizes and ${Object.keys(grades).length} grades\n`,
    );

    // Derivative code to primary size mapping
    const derivativePrimarySizeMap = {
      // FISH - Whole/Basic (kg sizes)
      WR: "UNSIZED",
      G: "UNSIZED",
      GG: "UNSIZED",
      HO: "UNSIZED",
      HG: "UNSIZED",
      DR: "UNSIZED",
      // FISH - Fillets/Cuts (g sizes)
      FIL_SK: "500_1KG",
      FIL_SF: "500_1KG",
      LN: "500_1KG",
      POR: "500_1KG",
      STK: "500_1KG",
      // FISH - Other parts
      TL: "500_1KG",
      CK: "300_500G",
      // SHRIMP - Count/kg only
      SHRIMP_PEELED: "21_25_COUNT",
      SHRIMP_PEELED_DEV: "21_25_COUNT",
      SHRIMP_PEELED_TALON: "21_25_COUNT",
      SHRIMP_EZ_PEEL: "21_25_COUNT",
      // CEPHALOPOD - CM sizes
      TUB: "20_30CM",
      TEN: "20_30CM",
      RNG: "20_30CM",
      WHOLE_CLEAN: "20_30CM",
      // BIVALVE - UNSIZED
      HS: "UNSIZED",
      SM: "UNSIZED",
      // COOKED - All UNSIZED
      CKD_SHRIMP_BOILED: "UNSIZED",
      CKD_CRAB_MEAT: "UNSIZED",
      CKD_LOBSTER_MEAT: "UNSIZED",
      CKD_FISH_COOKED: "UNSIZED",
      CKD_SQUID_COOKED: "UNSIZED",
      CKD_OCTOPUS_COOKED: "UNSIZED",
      CKD_BIVALVE_MEAT: "UNSIZED",
      CKD_BREADED_BATTERED: "UNSIZED",
      CKD_MARINATED_RTE: "UNSIZED",
      CKD_CANNED_RETORT: "UNSIZED",
    };

    // Apply sizes based on derivative code
    let updateCount = 0;

    for (const [derivCode, primarySize] of Object.entries(
      derivativePrimarySizeMap,
    )) {
      if (!sizes[primarySize]) {
        console.log(`⚠️  Size not found: ${primarySize}`);
        continue;
      }

      const result = await sequelize.query(
        `UPDATE species_derivative_size_grade_mapping sdm
         SET size_master_id = :sizeId,
             is_viable = true,
             updated_at = NOW()
         WHERE derivative_master_id IN (
           SELECT id FROM derivative_master WHERE derivative_code = :derivCode
         )
         AND (size_master_id IS NULL OR size_master_id != :sizeId)`,
        {
          replacements: {
            derivCode: derivCode,
            sizeId: sizes[primarySize],
          },
        },
      );

      updateCount += result[1]?.rowCount || 0;
    }

    console.log(`✅ Applied sizes to ${updateCount} mappings\n`);

    // Apply grades - Standard Export as default for all
    const standardExportId = grades["Standard Export"];
    if (standardExportId) {
      const result = await sequelize.query(
        `UPDATE species_derivative_size_grade_mapping
         SET grade_master_id = :gradeId,
             is_viable = true,
             updated_at = NOW()
         WHERE grade_master_id IS NULL`,
        {
          replacements: {
            gradeId: standardExportId,
          },
        },
      );

      console.log(`✅ Applied grade to ${result[1]?.rowCount || 0} mappings\n`);
    }

    // Show final statistics
    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_mappings,
        COUNT(DISTINCT size_master_id) as unique_sizes,
        COUNT(DISTINCT grade_master_id) as unique_grades,
        COUNT(CASE WHEN is_viable THEN 1 END) as viable_mappings
      FROM species_derivative_size_grade_mapping
      WHERE size_master_id IS NOT NULL AND grade_master_id IS NOT NULL
    `);

    console.log("📊 Final Statistics:");
    console.log(`   Total mappings: ${stats[0].total_mappings}`);
    console.log(`   Unique sizes applied: ${stats[0].unique_sizes}`);
    console.log(`   Unique grades applied: ${stats[0].unique_grades}`);
    console.log(`   Viable mappings: ${stats[0].viable_mappings}`);

    console.log("\n✅ Sizes and grades successfully applied!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

applySizesAndGrades();
