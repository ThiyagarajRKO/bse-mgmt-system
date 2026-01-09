"use strict";

/**
 * SEEDER: Update Grade Master with Proper Codes and Descriptions
 *
 * Grade Definitions:
 * A - Premium Export: Sushi / EU / Japan / US retail
 * B - Standard Export: Mainstream export, horeca
 * C - Domestic / Processing: Value-added, reprocessing
 * D - Industrial: Mince, surimi, feed, stock
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log("Seeding grade definitions with codes and descriptions...");

      // Get a valid system user
      const users = await queryInterface.sequelize.query(
        `SELECT id FROM user_profiles LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      const systemUserId = users.length > 0 ? users[0].id : null;

      if (!systemUserId) {
        throw new Error("No users found in user_profiles table");
      }

      // Grade definitions with codes
      const gradeDefinitions = [
        {
          code: "A",
          name: "Premium Export",
          description:
            "Sushi / EU / Japan / US retail - Highest quality for sashimi and premium international markets",
        },
        {
          code: "B",
          name: "Standard Export",
          description:
            "Mainstream export, horeca - Good quality for general export and restaurant/hotel use",
        },
        {
          code: "C",
          name: "Domestic / Processing",
          description:
            "Value-added, reprocessing - For domestic markets and further processing/co-packing",
        },
        {
          code: "D",
          name: "Industrial",
          description:
            "Mince, surimi, feed, stock - Industrial use, mince production, surimi, and animal feed",
        },
      ];

      // Update or create each grade
      for (const gradeDef of gradeDefinitions) {
        // Check if grade with this code exists
        const existingByCode = await queryInterface.sequelize.query(
          `SELECT id FROM grade_master WHERE grade_code = '${gradeDef.code}' LIMIT 1`,
          { type: Sequelize.QueryTypes.SELECT }
        );

        if (existingByCode.length > 0) {
          // Update existing
          await queryInterface.sequelize.query(`
            UPDATE grade_master 
            SET 
              grade_name = '${gradeDef.name.replace(/'/g, "''")}',
              description = '${gradeDef.description.replace(/'/g, "''")}',
              is_active = true,
              updated_at = NOW()
            WHERE grade_code = '${gradeDef.code}'
          `);
          console.log(`✅ Updated grade ${gradeDef.code} (${gradeDef.name})`);
        } else {
          // Check if grade with letter name exists (old format)
          const existingByName = await queryInterface.sequelize.query(
            `SELECT id FROM grade_master WHERE grade_name = '${gradeDef.code}' LIMIT 1`,
            { type: Sequelize.QueryTypes.SELECT }
          );

          if (existingByName.length > 0) {
            // Update the old format grade
            await queryInterface.sequelize.query(`
              UPDATE grade_master 
              SET 
                grade_code = '${gradeDef.code}',
                grade_name = '${gradeDef.name.replace(/'/g, "''")}',
                description = '${gradeDef.description.replace(/'/g, "''")}',
                is_active = true,
                updated_at = NOW()
              WHERE grade_name = '${gradeDef.code}'
            `);
            console.log(`✅ Updated grade ${gradeDef.code} (${gradeDef.name})`);
          } else {
            // Create new grade
            await queryInterface.sequelize.query(`
              INSERT INTO grade_master (
                id,
                grade_code,
                grade_name,
                description,
                is_active,
                created_at,
                created_by
              ) VALUES (
                gen_random_uuid(),
                '${gradeDef.code}',
                '${gradeDef.name.replace(/'/g, "''")}',
                '${gradeDef.description.replace(/'/g, "''")}',
                true,
                NOW(),
                '${systemUserId}'
              )
            `);
            console.log(`✅ Created grade ${gradeDef.code} (${gradeDef.name})`);
          }
        }
      }

      // Verify
      const allGrades = await queryInterface.sequelize.query(
        `SELECT grade_code, grade_name FROM grade_master WHERE is_active = true ORDER BY grade_code`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log("\n📊 Grade Summary:");
      for (const grade of allGrades) {
        console.log(`  ${grade.grade_code}: ${grade.grade_name}`);
      }

      console.log(`\n✅ Successfully seeded ${allGrades.length} grades`);
    } catch (error) {
      console.error("❌ Error seeding grades:", error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log("Reverting grade updates...");
      // Just mark as inactive instead of deleting
      await queryInterface.sequelize.query(
        `UPDATE grade_master SET is_active = false WHERE grade_code IN ('A', 'B', 'C', 'D')`
      );
      console.log("✅ Grade updates reverted");
    } catch (error) {
      console.error("Error reverting:", error);
      throw error;
    }
  },
};
