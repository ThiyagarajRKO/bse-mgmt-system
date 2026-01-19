#!/usr/bin/env node

/**
 * Direct SQL approach to populate sizes and grades for species-derivative mappings
 */

const { Sequelize } = require("sequelize");
require("dotenv").config();

async function updateSizesGradesDirect() {
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
    console.log("Updating sizes and grades for species-derivative mappings...");
    await sequelize.authenticate();
    console.log("Database connection established\n");

    // Update mappings with default sizes and grades
    const result = await sequelize.query(`
      UPDATE species_derivative_size_grade_mapping sdm
      SET 
        size_master_id = COALESCE(sdm.size_master_id, (SELECT id FROM size_master WHERE size = 'UNSIZED' LIMIT 1)),
        grade_master_id = COALESCE(sdm.grade_master_id, (SELECT id FROM grade_master WHERE grade_name = 'Standard Export' LIMIT 1)),
        updated_at = NOW()
      WHERE sdm.size_master_id IS NULL OR sdm.grade_master_id IS NULL
    `);

    console.log("✅ Updated mappings with default sizes/grades");

    // Show summary
    const [summary] = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT sm.size) as unique_sizes,
        COUNT(DISTINCT gm.grade_name) as unique_grades
      FROM species_derivative_size_grade_mapping sdm
      JOIN size_master sm ON sdm.size_master_id = sm.id
      JOIN grade_master gm ON sdm.grade_master_id = gm.id
    `);

    console.log(`\nSummary:`);
    console.log(`  Total mappings: ${summary[0].total}`);
    console.log(`  Unique sizes: ${summary[0].unique_sizes}`);
    console.log(`  Unique grades: ${summary[0].unique_grades}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

updateSizesGradesDirect();
