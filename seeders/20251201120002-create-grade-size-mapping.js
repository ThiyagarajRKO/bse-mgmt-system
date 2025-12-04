"use strict";

const { v4: uuidv4 } = require("uuid");
const rules = require("../rules");

/**
 * Grade-Size Mapping Seeder
 *
 * Purpose:
 * - Creates mappings between grades and applicable sizes
 * - Links each grade to the sizes it can be applied to
 * - Uses configuration from rules.gradeToSizes
 *
 * Dependencies:
 * - grade_master table (from 20251127100002-grade-and-size-master.js)
 * - size_master table (from 20251127100002-grade-and-size-master.js)
 * - grade_size_mapping table (created in migration)
 *
 * Usage:
 * npx sequelize-cli db:seed --seed 20251201120002-create-grade-size-mapping
 *
 * Data Flow:
 * rules.gradeToSizes → { gradeId: [sizeId1, sizeId2, ...], ... }
 *                  ↓
 *                Create mapping rows
 *                  ↓
 *              Insert to database
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log("\n🌱 Running grade-size mapping seeder...\n");

    try {
      // Extract grade-to-size mappings from rules configuration
      const gradeIdToSizeMapping = rules.gradeToSizes;

      if (
        !gradeIdToSizeMapping ||
        Object.keys(gradeIdToSizeMapping).length === 0
      ) {
        console.warn(
          "⚠️  No grade-to-size mappings found in rules configuration."
        );
        console.warn("   Ensure rules.gradeToSizes is properly configured.\n");
        return;
      }

      // Build mapping rows
      const rows = [];
      const gradeCount = Object.keys(gradeIdToSizeMapping).length;
      let totalMappings = 0;

      Object.entries(gradeIdToSizeMapping).forEach(([gradeId, sizeList]) => {
        if (!Array.isArray(sizeList)) {
          console.warn(
            `⚠️  Grade ${gradeId} has invalid size list (not an array)`
          );
          return;
        }

        sizeList.forEach((sizeId) => {
          rows.push({
            id: uuidv4(),
            grade_id: gradeId,
            size_id: sizeId,
            created_at: new Date(),
            updated_at: new Date(),
          });
          totalMappings++;
        });
      });

      if (rows.length === 0) {
        console.warn("⚠️  No valid grade-size mappings to insert.\n");
        return;
      }

      // Insert mapping rows
      await queryInterface.bulkInsert("grade_size_mapping", rows, {
        ignoreDuplicates: true,
      });

      console.log("✅ Grade-Size Mappings Seeded");
      console.log("─".repeat(60));
      console.log(`  Grades mapped: ${gradeCount}`);
      console.log(`  Total mappings: ${totalMappings}`);
      console.log(
        `  Avg. sizes per grade: ${(totalMappings / gradeCount).toFixed(1)}\n`
      );
    } catch (error) {
      console.error("❌ Error during seeding:", error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log("⏮️  Rolling back grade-size mappings...\n");

    try {
      await queryInterface.bulkDelete("grade_size_mapping", null, {});
      console.log("✅ Rollback complete\n");
    } catch (error) {
      console.error("❌ Error during rollback:", error.message);
      throw error;
    }
  },
};
