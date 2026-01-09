"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * GRADE MASTER SEEDER
 *
 * Seeds the grade_master table with standard seafood product grades
 *
 * Grades represent product quality tiers used for classification and pricing:
 * - A: Premium Export - Sushi, EU, Japan, US retail quality
 * - B: Standard Export - Mainstream export, horeca (hotels/restaurants/catering)
 * - C: Domestic / Processing - Value-added, reprocessing, domestic market
 * - D: Industrial - Mince, surimi, feed, stock, byproducts
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const systemUserId = "00000000-0000-0000-0000-000000000000"; // System user

    try {
      console.log("\n📊 Starting grade_master seeding...");

      // Check if grades already exist
      const existingGrades = await queryInterface.sequelize.query(
        "SELECT COUNT(*) as count FROM grade_master WHERE is_active = true",
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (existingGrades[0].count > 0) {
        console.log(
          `✅ Grade master already has ${existingGrades[0].count} active records, skipping...`
        );
        return;
      }

      // Define grades
      const grades = [
        {
          id: uuidv4(),
          grade_name: "Premium Export",
          grade_code: "A",
          description:
            "Sushi / EU / Japan / US retail - Premium quality seafood products suitable for high-end retail and sushi markets",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          grade_name: "Standard Export",
          grade_code: "B",
          description:
            "Mainstream export, horeca (hotels/restaurants/catering) - Quality seafood for commercial food service and mid-range export markets",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          grade_name: "Domestic / Processing",
          grade_code: "C",
          description:
            "Value-added, reprocessing - Seafood for domestic market and value-added processing (breaded, cooked, canned)",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          grade_name: "Industrial",
          grade_code: "D",
          description:
            "Mince, surimi, feed, stock - Seafood for industrial uses including minced meat, surimi base, animal feed, and stock production",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
      ];

      // Insert grades
      await queryInterface.bulkInsert("grade_master", grades, {});

      console.log(`✅ Inserted ${grades.length} grade records:`);
      grades.forEach((grade) => {
        console.log(`   - ${grade.grade_code}: ${grade.grade_name}`);
      });
      console.log("\n");
    } catch (error) {
      console.error("❌ Error seeding grade_master:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log("Removing grade_master seeded data...");

      // Delete grades by name
      const gradeNames = [
        "Premium Export",
        "Standard Export",
        "Domestic / Processing",
        "Industrial",
      ];

      for (const gradeName of gradeNames) {
        await queryInterface.sequelize.query(
          `DELETE FROM grade_master WHERE grade_name = ?`,
          {
            replacements: [gradeName],
            type: Sequelize.QueryTypes.DELETE,
          }
        );
      }

      console.log("✅ Removed grade_master seeded data");
    } catch (error) {
      console.error("Error removing grade_master seeded data:", error);
      throw error;
    }
  },
};
