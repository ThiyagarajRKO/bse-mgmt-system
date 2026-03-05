"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("[YIELD STANDARDS] 🌾 Starting yield standard population...");

    try {
      // Get all species
      const species = await queryInterface.sequelize.query(
        'SELECT id, species_name FROM species_master WHERE is_active = true',
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(`[YIELD STANDARDS] Found ${species.length} active species`);

      // Get all derivatives
      const derivatives = await queryInterface.sequelize.query(
        'SELECT id, derivative_name FROM derivative_master WHERE is_active = true',
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(`[YIELD STANDARDS] Found ${derivatives.length} active derivatives`);

      const yieldData = [];

      // Create yield standards for all combinations
      // Most poultry/meat products have 85-95% yield for raw processing
      // Some may have lower yields if processing involves more waste
      for (const spec of species) {
        for (const deriv of derivatives) {
          // Determine yield percentage based on species and derivative
          let yieldPct = 85.0; // Default conservative yield

          // Specific rules
          if (spec.species_name && spec.species_name.toLowerCase().includes("chicken")) {
            if (deriv.derivative_name && deriv.derivative_name.toLowerCase().includes("breast")) {
              yieldPct = 90.0; // Chicken breast: high yield
            } else if (deriv.derivative_name && deriv.derivative_name.toLowerCase().includes("thigh")) {
              yieldPct = 88.0; // Chicken thigh: good yield
            } else if (deriv.derivative_name && deriv.derivative_name.toLowerCase().includes("leg")) {
              yieldPct = 87.0; // Chicken leg: moderate yield
            } else {
              yieldPct = 85.0; // Default chicken yield
            }
          } else if (spec.species_name && spec.species_name.toLowerCase().includes("fish")) {
            yieldPct = 75.0; // Fish: lower yield due to bones, scales
          } else if (spec.species_name && spec.species_name.toLowerCase().includes("shrimp")) {
            yieldPct = 70.0; // Shrimp: lower yield due to shell processing
          } else if (spec.species_name && spec.species_name.toLowerCase().includes("mutton")) {
            yieldPct = 82.0; // Mutton: lower than chicken due to bone content
          } else if (spec.species_name && spec.species_name.toLowerCase().includes("goat")) {
            yieldPct = 83.0; // Goat: similar to mutton
          }

          // For RAW processing type
          yieldData.push({
            id: uuidv4(),
            species_id: spec.id,
            derivative_id: deriv.id,
            processing_type: "RAW",
            expected_yield_pct: yieldPct,
            allowed_variance_pct: 2.0,
            min_yield_threshold: Math.max(60, yieldPct - 10),
            max_yield_threshold: Math.min(99, yieldPct + 10),
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          });

          // For COOKED processing type (usually 5-15% less yield due to moisture loss)
          const cookedYield = Math.max(60, yieldPct - 10);
          yieldData.push({
            id: uuidv4(),
            species_id: spec.id,
            derivative_id: deriv.id,
            processing_type: "COOKED",
            expected_yield_pct: cookedYield,
            allowed_variance_pct: 3.0,
            min_yield_threshold: Math.max(50, cookedYield - 10),
            max_yield_threshold: Math.min(99, cookedYield + 10),
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          });
        }
      }

      if (yieldData.length === 0) {
        console.warn("[YIELD STANDARDS] ⚠️  No yield data generated - check species/derivative availability");
        return;
      }

      console.log(`[YIELD STANDARDS] 📊 Generated ${yieldData.length} yield standard records`);

      // Check if yield standards already exist
      const existingCount = await queryInterface.sequelize.query(
        'SELECT COUNT(*) as count FROM yield_standard_master WHERE is_active = true',
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (existingCount[0].count > 0) {
        console.log(
          `[YIELD STANDARDS] ℹ️  Yield standards already exist (${existingCount[0].count} records). Skipping insertion to avoid duplicates.`
        );
        return;
      }

      // Insert yield standards
      await queryInterface.bulkInsert("yield_standard_master", yieldData, {});

      console.log(`[YIELD STANDARDS] ✅ Successfully populated ${yieldData.length} yield standards`);

      // Log summary
      const summary = await queryInterface.sequelize.query(
        `SELECT 
          processing_type,
          COUNT(*) as count,
          AVG(CAST(expected_yield_pct AS DECIMAL)) as avg_yield
         FROM yield_standard_master 
         WHERE is_active = true
         GROUP BY processing_type`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log("[YIELD STANDARDS] 📈 Population Summary:");
      for (const row of summary) {
        console.log(
          `  • ${row.processing_type}: ${row.count} records (avg yield: ${parseFloat(row.avg_yield).toFixed(2)}%)`
        );
      }
    } catch (error) {
      console.error("[YIELD STANDARDS] 💥 Error populating yield standards:", error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log("[YIELD STANDARDS] Removing yield standard population...");
    try {
      // Delete all yield standards (or only recently added ones to be safe)
      await queryInterface.sequelize.query(
        'DELETE FROM yield_standard_master WHERE created_at >= NOW() - INTERVAL 1 DAY'
      );
      console.log("[YIELD STANDARDS] ✅ Yield standards removed");
    } catch (error) {
      console.error("[YIELD STANDARDS] Error removing yield standards:", error.message);
    }
  },
};
