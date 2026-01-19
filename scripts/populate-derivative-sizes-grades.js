#!/usr/bin/env node

/**
 * Populate species_derivative_size_grade_mapping with appropriate sizes and grades
 *
 * Logic:
 * - FISH: Whole/Gutted → kg sizes; Fillets/Steaks → g sizes
 * - SHRIMP: All variants → count/kg sizes only
 * - CRAB/LOBSTER: All variants → g/kg sizes
 * - SQUID/OCTOPUS: All variants → cm sizes (mantle length)
 * - BIVALVES: UNSIZED or count/kg
 * - COOKED: All grades (A, B, C) with UNSIZED
 */

const { Sequelize } = require("sequelize");
require("dotenv").config();

// Derivative to size mapping
const derivativeSizeMap = {
  // FISH - Whole/Basic
  WR: {
    sizes: ["500_1KG", "1_2KG", "2_3KG", "3UP_KG"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },
  G: {
    sizes: ["500_1KG", "1_2KG", "2_3KG", "3UP_KG"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },
  GG: {
    sizes: ["500_1KG", "1_2KG", "2_3KG", "3UP_KG"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },
  HO: {
    sizes: ["500_1KG", "1_2KG", "2_3KG", "3UP_KG"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },
  HG: {
    sizes: ["500_1KG", "1_2KG", "2_3KG", "3UP_KG"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },
  DR: {
    sizes: ["500_1KG", "1_2KG", "2_3KG", "3UP_KG"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },

  // FISH - Fillets/Cuts
  FIL_SK: {
    sizes: ["200_300G", "300_500G", "500_1KG"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },
  FIL_SF: {
    sizes: ["200_300G", "300_500G", "500_1KG"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },
  LN: {
    sizes: ["300_500G", "500_1KG", "1_2KG"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },
  POR: {
    sizes: ["200_300G", "300_500G", "500_1KG"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },
  STK: {
    sizes: ["300_500G", "500_1KG", "1_2KG"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },

  // FISH - Other parts
  TL: {
    sizes: ["300_500G", "500_1KG"],
    grades: ["Standard Export", "Domestic / Processing"],
  },
  CK: {
    sizes: ["200_300G", "300_500G"],
    grades: ["Standard Export", "Domestic / Processing"],
  },

  // SHRIMP - Count/kg only
  SHRIMP_PEELED: {
    sizes: ["16_20_COUNT", "21_25_COUNT", "26_30_COUNT"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },
  SHRIMP_PEELED_DEV: {
    sizes: ["16_20_COUNT", "21_25_COUNT", "26_30_COUNT"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },
  SHRIMP_PEELED_TALON: {
    sizes: ["16_20_COUNT", "21_25_COUNT", "26_30_COUNT"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },
  SHRIMP_EZ_PEEL: {
    sizes: ["16_20_COUNT", "21_25_COUNT", "26_30_COUNT"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },

  // CEPHALOPOD - CM sizes (mantle length)
  TUB: {
    sizes: ["10_20CM", "20_30CM", "30UP_CM"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },
  TEN: {
    sizes: ["10_20CM", "20_30CM", "30UP_CM"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },
  RNG: {
    sizes: ["10_20CM", "20_30CM", "30UP_CM"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },
  WHOLE_CLEAN: {
    sizes: ["10_20CM", "20_30CM", "30UP_CM"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },

  // BIVALVE - UNSIZED
  HS: {
    sizes: ["UNSIZED"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },
  SM: {
    sizes: ["UNSIZED"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },

  // COOKED - UNSIZED for all
  CKD_SHRIMP_BOILED: {
    sizes: ["UNSIZED"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },
  CKD_CRAB_MEAT: {
    sizes: ["UNSIZED"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },
  CKD_LOBSTER_MEAT: {
    sizes: ["UNSIZED"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },
  CKD_FISH_COOKED: {
    sizes: ["UNSIZED"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },
  CKD_SQUID_COOKED: {
    sizes: ["UNSIZED"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },
  CKD_OCTOPUS_COOKED: {
    sizes: ["UNSIZED"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },
  CKD_BIVALVE_MEAT: {
    sizes: ["UNSIZED"],
    grades: ["Premium Export", "Standard Export", "Domestic / Processing"],
  },
  CKD_BREADED_BATTERED: {
    sizes: ["UNSIZED"],
    grades: ["Domestic / Processing", "Industrial"],
  },
  CKD_MARINATED_RTE: {
    sizes: ["UNSIZED"],
    grades: ["Domestic / Processing", "Industrial"],
  },
  CKD_CANNED_RETORT: {
    sizes: ["UNSIZED"],
    grades: ["Domestic / Processing", "Industrial"],
  },
};

async function populateSizeGradeForDerivatives() {
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
      "Populating species_derivative_size_grade_mapping with sizes and grades...",
    );
    await sequelize.authenticate();
    console.log("Database connection established\n");

    // Get a valid user ID
    const [userResult] = await sequelize.query(
      `SELECT id FROM user_profiles LIMIT 1`,
    );
    const userId = userResult[0]?.id;

    if (!userId) {
      console.error("❌ No user profile found");
      process.exit(1);
    }

    // Get all size/grade IDs
    const [sizes] = await sequelize.query(
      `SELECT id, size FROM size_master WHERE is_active = true`,
    );
    const [grades] = await sequelize.query(
      `SELECT id, grade_name FROM grade_master WHERE is_active = true`,
    );

    const sizeMap = Object.fromEntries(sizes.map((s) => [s.size, s.id]));
    const gradeMap = Object.fromEntries(
      grades.map((g) => [g.grade_name, g.id]),
    );

    console.log(
      `Loaded ${Object.keys(sizeMap).length} sizes and ${Object.keys(gradeMap).length} grades\n`,
    );

    // Get existing mappings to update
    const [existingMappings] = await sequelize.query(
      `SELECT id, species_master_id, derivative_master_id 
       FROM species_derivative_size_grade_mapping 
       WHERE is_active = true`,
    );

    console.log(`Found ${existingMappings.length} mappings to process\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const mapping of existingMappings) {
      // Get the derivative code
      const [derivativeData] = await sequelize.query(
        `SELECT derivative_code FROM derivative_master WHERE id = :derivId`,
        {
          replacements: { derivId: mapping.derivative_master_id },
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (!derivativeData || !derivativeData[0]) continue;

      const derivCode = derivativeData[0].derivative_code;
      const sizeGradeConfig = derivativeSizeMap[derivCode];

      if (!sizeGradeConfig) {
        console.log(`⚠️  No size/grade config for derivative: ${derivCode}`);
        skippedCount++;
        continue;
      }

      // Update this mapping with the first size and grade
      const sizeId = sizeMap[sizeGradeConfig.sizes[0]];
      const gradeId = gradeMap[sizeGradeConfig.grades[0]];

      if (!sizeId || !gradeId) {
        console.log(`❌ Missing size or grade for ${derivCode}`);
        continue;
      }

      await sequelize.query(
        `UPDATE species_derivative_size_grade_mapping 
         SET size_master_id = :sizeId, 
             grade_master_id = :gradeId,
             updated_at = NOW(),
             updated_by = :userId
         WHERE id = :mappingId`,
        {
          replacements: {
            mappingId: mapping.id,
            sizeId: sizeId,
            gradeId: gradeId,
            userId: userId,
          },
        },
      );

      updatedCount++;

      // Also create variations for other sizes/grades of this derivative
      for (let i = 1; i < sizeGradeConfig.sizes.length; i++) {
        const altSize = sizeMap[sizeGradeConfig.sizes[i]];
        if (!altSize) continue;

        for (let j = 0; j < sizeGradeConfig.grades.length; j++) {
          const altGrade = gradeMap[sizeGradeConfig.grades[j]];
          if (!altGrade) continue;

          // Check if this combination already exists
          const [existing] = await sequelize.query(
            `SELECT id FROM species_derivative_size_grade_mapping 
             WHERE species_master_id = :speciesId 
             AND derivative_master_id = :derivId 
             AND size_master_id = :sizeId
             AND grade_master_id = :gradeId`,
            {
              replacements: {
                speciesId: mapping.species_master_id,
                derivId: mapping.derivative_master_id,
                sizeId: altSize,
                gradeId: altGrade,
              },
              type: sequelize.QueryTypes.SELECT,
            },
          );

          if (!existing || existing.length === 0) {
            // Create new variation
            await sequelize.query(
              `INSERT INTO species_derivative_size_grade_mapping (
                id,
                species_master_id,
                derivative_master_id,
                size_master_id,
                grade_master_id,
                is_viable,
                is_active,
                created_at,
                updated_at,
                created_by
              ) VALUES (
                gen_random_uuid(),
                :speciesId,
                :derivId,
                :sizeId,
                :gradeId,
                true,
                true,
                NOW(),
                NOW(),
                :userId
              )`,
              {
                replacements: {
                  speciesId: mapping.species_master_id,
                  derivId: mapping.derivative_master_id,
                  sizeId: altSize,
                  gradeId: altGrade,
                  userId: userId,
                },
              },
            );
          }
        }
      }
    }

    console.log(`\n✅ Completed!`);
    console.log(
      `   Updated: ${updatedCount} existing mappings with sizes/grades`,
    );
    console.log(
      `   Skipped: ${skippedCount} mappings without size/grade config`,
    );
    console.log(
      `   Created: Multiple size/grade variations for each derivative`,
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

populateSizeGradeForDerivatives();
