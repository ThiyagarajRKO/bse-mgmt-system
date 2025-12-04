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
    try {
      // Extract grade-to-size mappings from rules configuration
      const gradeIdToSizeMapping = rules.gradeToSizes;

      if (
        !gradeIdToSizeMapping ||
        Object.keys(gradeIdToSizeMapping).length === 0
      ) {
        return;
      }

      // Build mapping rows
      const rows = [];
      const gradeCount = Object.keys(gradeIdToSizeMapping).length;
      let totalMappings = 0;

      Object.entries(gradeIdToSizeMapping).forEach(([gradeId, sizeList]) => {
        if (!Array.isArray(sizeList)) {
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
        return;
      }

      // Insert mapping rows
      await queryInterface.bulkInsert("grade_size_mapping", rows, {
        ignoreDuplicates: true,
      });
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.bulkDelete("grade_size_mapping", null, {});
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  },
};
