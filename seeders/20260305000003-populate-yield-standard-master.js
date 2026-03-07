"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * CONSOLIDATED YIELD STANDARD SEEDER
 *
 * Consolidates both population and species-specific fixes (shark/ray) into one file.
 * Handles initial population and ensures shark/ray species have correct yields.
 *
 * Yield Standards by Species:
 * - Shark: 65% RAW, 55% COOKED (thick skin, cartilage, high bone content)
 * - Ray: 68% RAW, 58% COOKED (wing structure, similar waste to shark)
 * - Fish (general): 75% RAW, 65% COOKED (bones, scales)
 * - Shrimp: 70% RAW, 60% COOKED (shell processing)
 * - Default: 85% RAW, 75% COOKED
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log(
      "[YIELD STANDARDS] 🌾 Starting consolidated yield standard population...",
    );

    try {
      // Get all species
      const species = await queryInterface.sequelize.query(
        "SELECT id, species_name FROM species_master WHERE is_active = true",
        { type: Sequelize.QueryTypes.SELECT },
      );

      console.log(`[YIELD STANDARDS] Found ${species.length} active species`);

      // Get all derivatives
      const derivatives = await queryInterface.sequelize.query(
        "SELECT id, derivative_name FROM derivative_master WHERE is_active = true",
        { type: Sequelize.QueryTypes.SELECT },
      );

      console.log(
        `[YIELD STANDARDS] Found ${derivatives.length} active derivatives`,
      );

      const yieldData = [];

      // Create yield standards for all species x derivative combinations
      for (const spec of species) {
        for (const deriv of derivatives) {
          // Determine yield percentage based on species
          let yieldPct = 85.0; // Default conservative yield

          // Species-specific rules (order matters: most specific first)
          if (
            spec.species_name &&
            spec.species_name.toLowerCase().includes("chicken")
          ) {
            if (
              deriv.derivative_name &&
              deriv.derivative_name.toLowerCase().includes("breast")
            ) {
              yieldPct = 90.0; // Chicken breast: high yield
            } else if (
              deriv.derivative_name &&
              deriv.derivative_name.toLowerCase().includes("thigh")
            ) {
              yieldPct = 88.0; // Chicken thigh: good yield
            } else if (
              deriv.derivative_name &&
              deriv.derivative_name.toLowerCase().includes("leg")
            ) {
              yieldPct = 87.0; // Chicken leg: moderate yield
            } else {
              yieldPct = 85.0; // Default chicken yield
            }
          } else if (
            spec.species_name &&
            spec.species_name.toLowerCase().includes("shark")
          ) {
            yieldPct = 65.0; // Shark: low yield due to thick skin, cartilage, high bone content
          } else if (
            spec.species_name &&
            spec.species_name.toLowerCase().includes("ray")
          ) {
            yieldPct = 68.0; // Ray: similar to shark, lower yield due to wing structure
          } else if (
            spec.species_name &&
            spec.species_name.toLowerCase().includes("fish")
          ) {
            yieldPct = 75.0; // Fish: lower yield due to bones, scales
          } else if (
            spec.species_name &&
            spec.species_name.toLowerCase().includes("shrimp")
          ) {
            yieldPct = 70.0; // Shrimp: lower yield due to shell processing
          } else if (
            spec.species_name &&
            spec.species_name.toLowerCase().includes("mutton")
          ) {
            yieldPct = 82.0; // Mutton: lower than chicken due to bone content
          } else if (
            spec.species_name &&
            spec.species_name.toLowerCase().includes("goat")
          ) {
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
            min_yield_threshold: Math.max(50, yieldPct - 15),
            max_yield_threshold: Math.min(99, yieldPct + 10),
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          });

          // For COOKED processing type (usually 10% less yield due to moisture loss)
          const cookedYield = Math.max(55, yieldPct - 10);
          yieldData.push({
            id: uuidv4(),
            species_id: spec.id,
            derivative_id: deriv.id,
            processing_type: "COOKED",
            expected_yield_pct: cookedYield,
            allowed_variance_pct: 3.0,
            min_yield_threshold: Math.max(45, cookedYield - 15),
            max_yield_threshold: Math.min(99, cookedYield + 10),
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          });
        }
      }

      if (yieldData.length === 0) {
        console.warn(
          "[YIELD STANDARDS] ⚠️  No yield data generated - check species/derivative availability",
        );
        return;
      }

      console.log(
        `[YIELD STANDARDS] 📊 Generated ${yieldData.length} yield standard records`,
      );

      // Check if yield standards already exist
      const existingCount = await queryInterface.sequelize.query(
        "SELECT COUNT(*) as count FROM yield_standard_master WHERE is_active = true",
        { type: Sequelize.QueryTypes.SELECT },
      );

      if (existingCount[0].count > 0) {
        console.log(
          `[YIELD STANDARDS] ℹ️  Yield standards already exist (${existingCount[0].count} records). Applying updates...`,
        );

        // Update shark yields to correct values
        const sharkSpecies = await queryInterface.sequelize.query(
          `SELECT id FROM species_master WHERE species_name ILIKE '%shark%' AND is_active = true`,
          { type: Sequelize.QueryTypes.SELECT },
        );

        if (sharkSpecies.length > 0) {
          const sharkIds = sharkSpecies.map((s) => s.id);
          await queryInterface.sequelize.query(
            `UPDATE yield_standard_master 
             SET expected_yield_pct = 65.0, min_yield_threshold = 55, max_yield_threshold = 75, updated_at = NOW()
             WHERE species_id IN (:sharkIds) AND processing_type = 'RAW' AND is_active = true`,
            {
              replacements: { sharkIds },
              type: Sequelize.QueryTypes.UPDATE,
            },
          );

          await queryInterface.sequelize.query(
            `UPDATE yield_standard_master 
             SET expected_yield_pct = 55.0, min_yield_threshold = 45, max_yield_threshold = 65, updated_at = NOW()
             WHERE species_id IN (:sharkIds) AND processing_type = 'COOKED' AND is_active = true`,
            {
              replacements: { sharkIds },
              type: Sequelize.QueryTypes.UPDATE,
            },
          );

          console.log(
            `[YIELD STANDARDS] ✅ Updated ${sharkSpecies.length} shark species`,
          );
        }

        // Update ray yields to correct values
        const raySpecies = await queryInterface.sequelize.query(
          `SELECT id FROM species_master WHERE species_name ILIKE '%ray%' AND is_active = true`,
          { type: Sequelize.QueryTypes.SELECT },
        );

        if (raySpecies.length > 0) {
          const rayIds = raySpecies.map((r) => r.id);
          await queryInterface.sequelize.query(
            `UPDATE yield_standard_master 
             SET expected_yield_pct = 68.0, min_yield_threshold = 58, max_yield_threshold = 78, updated_at = NOW()
             WHERE species_id IN (:rayIds) AND processing_type = 'RAW' AND is_active = true`,
            {
              replacements: { rayIds },
              type: Sequelize.QueryTypes.UPDATE,
            },
          );

          await queryInterface.sequelize.query(
            `UPDATE yield_standard_master 
             SET expected_yield_pct = 58.0, min_yield_threshold = 48, max_yield_threshold = 68, updated_at = NOW()
             WHERE species_id IN (:rayIds) AND processing_type = 'COOKED' AND is_active = true`,
            {
              replacements: { rayIds },
              type: Sequelize.QueryTypes.UPDATE,
            },
          );

          console.log(
            `[YIELD STANDARDS] ✅ Updated ${raySpecies.length} ray species`,
          );
        }

        console.log(`[YIELD STANDARDS] ✅ Yield standards synchronized`);
      } else {
        // Insert yield standards
        await queryInterface.bulkInsert("yield_standard_master", yieldData, {});
        console.log(
          `[YIELD STANDARDS] ✅ Successfully populated ${yieldData.length} yield standards`,
        );
      }

      // Log summary
      const summary = await queryInterface.sequelize.query(
        `SELECT 
          processing_type,
          COUNT(*) as count,
          ROUND(AVG(CAST(expected_yield_pct AS DECIMAL(5,2))), 2) as avg_yield,
          MIN(CAST(expected_yield_pct AS DECIMAL(5,2))) as min_yield,
          MAX(CAST(expected_yield_pct AS DECIMAL(5,2))) as max_yield
         FROM yield_standard_master 
         WHERE is_active = true
         GROUP BY processing_type
         ORDER BY processing_type`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      console.log("[YIELD STANDARDS] 📈 Final Summary:");
      for (const row of summary) {
        console.log(
          `  • ${row.processing_type}: ${row.count} records | Avg: ${row.avg_yield}% | Range: ${row.min_yield}%-${row.max_yield}%`,
        );
      }

      console.log("[YIELD STANDARDS] ✅ Consolidated seeding complete");
    } catch (error) {
      console.error(
        "[YIELD STANDARDS] 💥 Error in consolidated seeding:",
        error.message,
      );
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log("[YIELD STANDARDS] Removing yield standard data...");
    try {
      await queryInterface.sequelize.query("DELETE FROM yield_standard_master");
      console.log("[YIELD STANDARDS] ✅ Yield standards removed");
    } catch (error) {
      console.error(
        "[YIELD STANDARDS] Error removing yield standards:",
        error.message,
      );
    }
  },
};
