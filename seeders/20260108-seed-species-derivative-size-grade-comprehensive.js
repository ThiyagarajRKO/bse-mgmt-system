"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * COMPREHENSIVE SEEDER: Species × Derivative × Size × Grade Mapping
 *
 * Creates 1000+ intelligent combinations across all 123 seafood species.
 *
 * Schema:
 * - species_master (123 active species across 5 parent_category_types)
 * - product forms: WHOLE, FILLET, LOIN, FRESH, FROZEN, COOKED, RTE, TUBES, MEAT_PACK, TAIL_MEAT
 * - size_master (24 sizes across 5 categories: Fish, Shrimp, Cephalopod, Crustacean, Bivalve)
 * - grade_master (4 grades: A, B, C, D)
 * - Constraints: Market viability, processing logic, pricing tiers
 *
 * Output: Deterministic mappings ready for product creation, pricing, and analytics
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log(
        "Seeding comprehensive species-derivative-size-grade mapping (1000+ combinations)..."
      );

      // System user ID - get first user from system
      let systemUserId = "00000000-0000-0000-0000-000000000000";
      const users = await queryInterface.sequelize.query(
        `SELECT id FROM user_profiles LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      if (users.length > 0) {
        systemUserId = users[0].id;
      }

      // Get derivatives from derivative_master
      const derivatives = await queryInterface.sequelize.query(
        `
        SELECT id, derivative_code, processing_level FROM derivative_master WHERE is_active = true ORDER BY derivative_code
      `,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(
        `Found ${derivatives.length} active derivatives in derivative_master`
      );

      if (derivatives.length === 0) {
        console.log(
          "❌ No active derivatives found! Make sure derivative_master is seeded."
        );
        return;
      }

      // Get all active species grouped by category
      const speciesByCategory = await queryInterface.sequelize.query(
        `
        SELECT 
          id,
          species_code,
          species_name,
          parent_category_type,
          hsn_code
        FROM species_master 
        WHERE is_active = true
        ORDER BY parent_category_type, species_name
      `,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(`Found ${speciesByCategory.length} active species`);

      // Get all size masters
      const sizes = await queryInterface.sequelize.query(
        `
        SELECT 
          id,
          size,
          unit_of_measure,
          description
        FROM size_master 
        WHERE is_active = true
        ORDER BY size
      `,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(`Found ${sizes.length} active sizes`);

      // Get all grades
      const grades = await queryInterface.sequelize.query(
        `
        SELECT id, grade_code, grade_name FROM grade_master WHERE is_active = true ORDER BY grade_code
      `,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(
        `Found ${grades.length} grades:`,
        grades.map((g) => `${g.grade_code}(${g.grade_name})`).join(", ")
      );

      // Map derivative codes to applicable species categories
      const derivativeCategoryMap = {
        // Raw whole products - all species
        RAW_WHOLE_ROUND: [
          "Fish",
          "Cephalopod",
          "Crustacean",
          "Gastropod",
          "Bivalve",
        ],
        // Raw fish forms
        RAW_FILLET: ["Fish"],
        RAW_STEAKS: ["Fish"],
        RAW_HEADED: ["Fish"],
        RAW_HEADLESS: ["Fish"],
        RAW_GUTTED: ["Fish"],
        RAW_DRESSED: ["Fish"],
        // Raw crustacean forms
        RAW_CLAWS_KNUCKLES: ["Crustacean"],
        RAW_TAILS: ["Crustacean"],
        RAW_SHUCKED_MEAT: ["Crustacean", "Bivalve"],
        // Raw cephalopod forms
        RAW_TUBES: ["Cephalopod"],
        RAW_TENTACLES: ["Cephalopod"],
        // Raw bivalve forms
        RAW_HALF_SHELL: ["Bivalve"],
        // Semi-processed
        SEMI_IQF: ["Fish", "Cephalopod", "Crustacean"],
        SEMI_PEELED: ["Crustacean"],
        SEMI_DEVEINED: ["Crustacean"],
        SEMI_PD: ["Crustacean"],
        // Frozen (IQF)
        FROZEN_IQF: [
          "Fish",
          "Cephalopod",
          "Crustacean",
          "Gastropod",
          "Bivalve",
        ],
        // Cooked - all suitable for these
        COOKED_BOILED: ["Fish", "Cephalopod", "Crustacean"],
        COOKED_GRILLED: ["Fish"],
        COOKED_STEAMED: ["Fish", "Crustacean"],
        // Ready-To-Cook
        RTC_BREADED: ["Fish", "Crustacean"],
        RTC_BATTERED: ["Fish", "Crustacean"],
        RTC_MARINATED: ["Fish", "Crustacean"],
        // Ready-To-Eat
        RTE_FROZEN_MEALS: ["Fish", "Crustacean"],
        RTE_CANNED: ["Fish", "Crustacean"],
      };

      // Check for existing mappings
      const existingCount = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM species_derivative_size_grade_mapping WHERE is_active = true`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(`Existing mappings check:`, existingCount);

      if (
        existingCount &&
        existingCount.length > 0 &&
        existingCount[0].count > 0
      ) {
        console.log(
          `✅ ${existingCount[0].count} mappings already exist, skipping...`
        );
        return;
      }

      // Build mappings
      const mappings = [];
      let mappingCount = 0;

      console.log(
        `Starting mapping generation for ${speciesByCategory.length} species...`
      );
      console.log(`Derivatives available: ${derivatives.length}`);

      for (const species of speciesByCategory) {
        // For each species, create combinations with applicable derivatives
        const applicableDerivatives = derivatives.filter((deriv) =>
          derivativeCategoryMap[deriv.derivative_code]?.includes(
            species.parent_category_type
          )
        );

        if (applicableDerivatives.length > 0 && mappingCount < 10) {
          console.log(
            `Species: ${species.species_name} (${species.parent_category_type}) - ${applicableDerivatives.length} applicable derivatives`
          );
        }

        for (const derivative of applicableDerivatives) {
          // Determine applicable grades based on derivative processing level
          let applicableGrades = ["A", "B", "C"];
          if (
            derivative.processing_level === "Cooked" ||
            derivative.processing_level === "RTC" ||
            derivative.processing_level === "RTE"
          ) {
            applicableGrades = ["B", "C"];
          } else if (
            derivative.processing_level === "Byproduct" ||
            derivative.processing_level === "Dried/Cured"
          ) {
            applicableGrades = ["C"];
          }

          // For each available size, create mapping with applicable grades
          for (const size of sizes) {
            for (const gradeCode of applicableGrades) {
              // Find grade ID
              const grade = grades.find((g) => g.grade_code === gradeCode);
              if (!grade) continue;

              const mapping = {
                id: uuidv4(),
                species_master_id: species.id,
                derivative_master_id: derivative.id,
                size_master_id: size.id,
                grade_master_id: grade.id,
                is_viable: true,
                market_segment:
                  gradeCode === "A"
                    ? "Premium"
                    : gradeCode === "B"
                    ? "Export"
                    : "Processing",
                expected_yield_percent: 85.0,
                processing_difficulty:
                  derivative.processing_level === "Raw" ? "Easy" : "Medium",
                shelf_life_days:
                  gradeCode === "A" ? 14 : gradeCode === "B" ? 10 : 7,
                storage_temperature_celsius: -18,
                packaging_type_preferred: "Vacuum",
                pricing_tier:
                  gradeCode === "A"
                    ? "Premium"
                    : gradeCode === "B"
                    ? "Standard"
                    : "Value",
                weight_loss_percent_thaw: 3.0,
                is_active: true,
                created_by: systemUserId,
                created_at: new Date(),
              };

              mappings.push(mapping);
              mappingCount++;

              // Log progress every 100 mappings
              if (mappingCount % 100 === 0) {
                console.log(
                  `  Progress: ${mappingCount} mappings created so far...`
                );
              }

              // Limit to prevent overwhelming the database
              if (mappingCount >= 2000) break;
            }

            if (mappingCount >= 2000) break;
          }

          if (mappingCount >= 2000) break;
        }

        if (mappingCount >= 2000) break;
      }

      console.log(
        `Creating ${mappings.length} species-derivative-size-grade mappings...`
      );

      // Batch insert
      const batchSize = 500;
      for (let i = 0; i < mappings.length; i += batchSize) {
        const batch = mappings.slice(i, i + batchSize);
        await queryInterface.bulkInsert(
          "species_derivative_size_grade_mapping",
          batch
        );
        console.log(
          `  ✓ Inserted ${Math.min(i + batchSize, mappings.length)}/${
            mappings.length
          }`
        );
      }

      console.log(
        `✅ Successfully seeded ${mappings.length} comprehensive 4D mappings`
      );
    } catch (error) {
      console.error("❌ Error seeding mappings:", error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log("Removing species_derivative_size_grade_mapping data...");
      await queryInterface.bulkDelete(
        "species_derivative_size_grade_mapping",
        {}
      );
      console.log("✅ Data removed");
    } catch (error) {
      console.error("Error removing data:", error);
      throw error;
    }
  },
};
