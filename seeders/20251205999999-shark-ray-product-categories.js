"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * Shark & Ray Product Categories Seeder
 *
 * Maps shark and ray species to product categories with specific grade combinations.
 * Creates comprehensive product category entries for:
 * - 9 Shark species (SH001-SH009)
 * - 5 Ray species (RY001-RY005)
 *
 * Each species has multiple product categories based on their processing forms and grades.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log("Seeding shark and ray product categories...");

      // Fetch species IDs by code
      const speciesRows = await queryInterface.sequelize.query(
        `SELECT id, species_code, species_name FROM species_master 
         WHERE species_code IN ('SH001', 'SH002', 'SH003', 'SH004', 'SH005', 'SH006', 'SH007', 'SH008', 'SH009', 'RY001', 'RY002', 'RY003', 'RY004', 'RY005')`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      const speciesMap = {};
      speciesRows.forEach((s) => {
        speciesMap[s.species_code] = s.id;
      });

      console.log(`Found ${speciesRows.length} shark/ray species in database`);
      if (speciesRows.length === 0) {
        console.warn(
          "⚠️ No shark/ray species found. Please run species seeder first."
        );
        return;
      }

      // Fetch grade IDs by grade_name
      const gradeRows = await queryInterface.sequelize.query(
        `SELECT id, grade_name FROM grade_master 
         WHERE grade_name IN ('Whole', 'Cut Piece', 'Skinless Fillet', 'Boneless Fillet', 'Flake Cut', 'Wing Cut', 'Wing Fillet')`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      const gradeMap = {};
      gradeRows.forEach((g) => {
        gradeMap[g.grade_name] = g.id;
      });

      console.log(`Found ${gradeRows.length} shark/ray grades in database`);

      // Define shark and ray product categories with species, grades, and sizes
      const productCategories = [
        // ==================== SHARK SPECIES ====================

        // SH001: Spiny Dogfish (Mudhal / Kadal Sura)
        // Sizes: Small (30–50 cm), Medium (50–70 cm), Large (70–90 cm)
        // Grades: Whole, Cut Piece, Skinless Fillet
        {
          species_code: "SH001",
          product_category: "Spiny Dogfish Whole",
          grades: ["Whole"],
          sizes: ["Small (30–50 cm)", "Medium (50–70 cm)", "Large (70–90 cm)"],
        },
        {
          species_code: "SH001",
          product_category: "Spiny Dogfish Cut Piece",
          grades: ["Cut Piece"],
          sizes: ["Small (30–50 cm)", "Medium (50–70 cm)", "Large (70–90 cm)"],
        },
        {
          species_code: "SH001",
          product_category: "Spiny Dogfish Skinless Fillet",
          grades: ["Skinless Fillet"],
          sizes: ["Small (30–50 cm)", "Medium (50–70 cm)", "Large (70–90 cm)"],
        },

        // SH002: Hammerhead Shark (Young Ones)
        // Sizes: Small (40–60 cm), Medium (60–90 cm)
        // Grades: Whole, Cut Piece
        {
          species_code: "SH002",
          product_category: "Hammerhead Shark Whole",
          grades: ["Whole"],
          sizes: ["Small (40–60 cm)", "Medium (60–90 cm)"],
        },
        {
          species_code: "SH002",
          product_category: "Hammerhead Shark Cut Piece",
          grades: ["Cut Piece"],
          sizes: ["Small (40–60 cm)", "Medium (60–90 cm)"],
        },

        // SH003: Milk Shark (Sura)
        // Sizes: Small (30–50 cm), Medium (50–70 cm), Large (70–100 cm)
        // Grades: Whole, Cut Piece, Boneless Fillet
        {
          species_code: "SH003",
          product_category: "Milk Shark Whole",
          grades: ["Whole"],
          sizes: ["Small (30–50 cm)", "Medium (50–70 cm)", "Large (70–100 cm)"],
        },
        {
          species_code: "SH003",
          product_category: "Milk Shark Cut Piece",
          grades: ["Cut Piece"],
          sizes: ["Small (30–50 cm)", "Medium (50–70 cm)", "Large (70–100 cm)"],
        },
        {
          species_code: "SH003",
          product_category: "Milk Shark Boneless Fillet",
          grades: ["Boneless Fillet"],
          sizes: ["Small (30–50 cm)", "Medium (50–70 cm)", "Large (70–100 cm)"],
        },

        // SH004: Gummy Shark
        // Sizes: Small (40–60 cm), Medium (60–80 cm), Large (80–120 cm)
        // Grades: Flake Cut, Whole, Boneless Fillet
        {
          species_code: "SH004",
          product_category: "Gummy Shark Flake Cut",
          grades: ["Flake Cut"],
          sizes: ["Small (40–60 cm)", "Medium (60–80 cm)", "Large (80–120 cm)"],
        },
        {
          species_code: "SH004",
          product_category: "Gummy Shark Whole",
          grades: ["Whole"],
          sizes: ["Small (40–60 cm)", "Medium (60–80 cm)", "Large (80–120 cm)"],
        },
        {
          species_code: "SH004",
          product_category: "Gummy Shark Boneless Fillet",
          grades: ["Boneless Fillet"],
          sizes: ["Small (40–60 cm)", "Medium (60–80 cm)", "Large (80–120 cm)"],
        },

        // SH005: Blacktip Shark
        // Sizes: Small (40–60 cm), Medium (60–80 cm), Large (80–120 cm)
        // Grades: Whole, Cut Piece, Skinless Fillet
        {
          species_code: "SH005",
          product_category: "Blacktip Shark Whole",
          grades: ["Whole"],
          sizes: ["Small (40–60 cm)", "Medium (60–80 cm)", "Large (80–120 cm)"],
        },
        {
          species_code: "SH005",
          product_category: "Blacktip Shark Cut Piece",
          grades: ["Cut Piece"],
          sizes: ["Small (40–60 cm)", "Medium (60–80 cm)", "Large (80–120 cm)"],
        },
        {
          species_code: "SH005",
          product_category: "Blacktip Shark Skinless Fillet",
          grades: ["Skinless Fillet"],
          sizes: ["Small (40–60 cm)", "Medium (60–80 cm)", "Large (80–120 cm)"],
        },

        // SH006: Bull Shark
        // Sizes: Small (30–50 cm), Medium (50–70 cm), Large (70–90 cm)
        // Grades: Whole, Cut Piece
        {
          species_code: "SH006",
          product_category: "Bull Shark Whole",
          grades: ["Whole"],
          sizes: ["Small (30–50 cm)", "Medium (50–70 cm)", "Large (70–90 cm)"],
        },
        {
          species_code: "SH006",
          product_category: "Bull Shark Cut Piece",
          grades: ["Cut Piece"],
          sizes: ["Small (30–50 cm)", "Medium (50–70 cm)", "Large (70–90 cm)"],
        },

        // SH007: Sandbar Shark
        // Sizes: Small (40–60 cm), Medium (60–80 cm), Large (80–120 cm)
        // Grades: Whole, Cut Piece
        {
          species_code: "SH007",
          product_category: "Sandbar Shark Whole",
          grades: ["Whole"],
          sizes: ["Small (40–60 cm)", "Medium (60–80 cm)", "Large (80–120 cm)"],
        },
        {
          species_code: "SH007",
          product_category: "Sandbar Shark Cut Piece",
          grades: ["Cut Piece"],
          sizes: ["Small (40–60 cm)", "Medium (60–80 cm)", "Large (80–120 cm)"],
        },

        // SH008: Tiger Shark
        // Sizes: Small (30–50 cm), Medium (50–70 cm), Large (70–90 cm)
        // Grades: Whole, Cut Piece
        {
          species_code: "SH008",
          product_category: "Tiger Shark Whole",
          grades: ["Whole"],
          sizes: ["Small (30–50 cm)", "Medium (50–70 cm)", "Large (70–90 cm)"],
        },
        {
          species_code: "SH008",
          product_category: "Tiger Shark Cut Piece",
          grades: ["Cut Piece"],
          sizes: ["Small (30–50 cm)", "Medium (50–70 cm)", "Large (70–90 cm)"],
        },

        // SH009: Blue Shark
        // Sizes: Small (30–50 cm), Medium (50–70 cm), Large (70–90 cm)
        // Grades: Whole, Cut Piece
        {
          species_code: "SH009",
          product_category: "Blue Shark Whole",
          grades: ["Whole"],
          sizes: ["Small (30–50 cm)", "Medium (50–70 cm)", "Large (70–90 cm)"],
        },
        {
          species_code: "SH009",
          product_category: "Blue Shark Cut Piece",
          grades: ["Cut Piece"],
          sizes: ["Small (30–50 cm)", "Medium (50–70 cm)", "Large (70–90 cm)"],
        },

        // ==================== RAY SPECIES ====================

        // RY001: Honeycomb Ray
        // Sizes: Medium (1–2 kg), Large (2–3.5 kg)
        // Grades: Whole, Wing Fillet
        {
          species_code: "RY001",
          product_category: "Honeycomb Ray Whole",
          grades: ["Whole"],
          sizes: ["Medium (1–2 kg)", "Large (2–3.5 kg)"],
        },
        {
          species_code: "RY001",
          product_category: "Honeycomb Ray Wing Fillet",
          grades: ["Wing Fillet"],
          sizes: ["Medium (1–2 kg)", "Large (2–3.5 kg)"],
        },

        // RY002: Whip Ray
        // Sizes: Medium (1–2 kg), Large (2–4 kg), Jumbo (>4 kg)
        // Grades: Wing Fillet, Whole
        {
          species_code: "RY002",
          product_category: "Whip Ray Wing Fillet",
          grades: ["Wing Fillet"],
          sizes: ["Medium (1–2 kg)", "Large (2–4 kg)", "Jumbo (>4 kg)"],
        },
        {
          species_code: "RY002",
          product_category: "Whip Ray Whole",
          grades: ["Whole"],
          sizes: ["Medium (1–2 kg)", "Large (2–4 kg)", "Jumbo (>4 kg)"],
        },

        // RY003: Cow Nose Ray
        // Sizes: Small (1–2 kg), Medium (2–3 kg), Large (3–5 kg)
        // Grades: Whole, Wing Cut, Boneless Fillet
        {
          species_code: "RY003",
          product_category: "Cow Nose Ray Whole",
          grades: ["Whole"],
          sizes: ["Small (1–2 kg)", "Medium (2–3 kg)", "Large (3–5 kg)"],
        },
        {
          species_code: "RY003",
          product_category: "Cow Nose Ray Wing Cut",
          grades: ["Wing Cut"],
          sizes: ["Small (1–2 kg)", "Medium (2–3 kg)", "Large (3–5 kg)"],
        },
        {
          species_code: "RY003",
          product_category: "Cow Nose Ray Boneless Fillet",
          grades: ["Boneless Fillet"],
          sizes: ["Small (1–2 kg)", "Medium (2–3 kg)", "Large (3–5 kg)"],
        },

        // RY004: Blue Spotted Ray
        // Sizes: Medium (1–2 kg), Medium (2–3 kg)
        // Grades: Whole, Wing Fillet
        {
          species_code: "RY004",
          product_category: "Blue Spotted Ray Whole",
          grades: ["Whole"],
          sizes: ["Medium (1–2 kg)", "Medium (2–3 kg)"],
        },
        {
          species_code: "RY004",
          product_category: "Blue Spotted Ray Wing Fillet",
          grades: ["Wing Fillet"],
          sizes: ["Medium (1–2 kg)", "Medium (2–3 kg)"],
        },

        // RY005: Mangrove Whip Ray
        // Sizes: Medium (1–2 kg), Large (2–4 kg), Jumbo (>4 kg)
        // Grades: Wing Fillet, Whole
        {
          species_code: "RY005",
          product_category: "Mangrove Whip Ray Wing Fillet",
          grades: ["Wing Fillet"],
          sizes: ["Medium (1–2 kg)", "Large (2–4 kg)", "Jumbo (>4 kg)"],
        },
        {
          species_code: "RY005",
          product_category: "Mangrove Whip Ray Whole",
          grades: ["Whole"],
          sizes: ["Medium (1–2 kg)", "Large (2–4 kg)", "Jumbo (>4 kg)"],
        },
      ];

      // Create product category records
      const categoryRecords = [];
      const categoryGradeMappings = [];

      productCategories.forEach((cat) => {
        const speciesId = speciesMap[cat.species_code];
        if (!speciesId) {
          console.warn(`⚠️ Species ${cat.species_code} not found`);
          return;
        }

        // Create a single product category for this grade type
        const categoryId = uuidv4();
        const categoryName = cat.product_category;

        // Add product category record
        categoryRecords.push({
          id: categoryId,
          product_category: categoryName,
          species_master_id: speciesId,
          is_active: true,
          created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
          created_at: new Date(),
          updated_at: new Date(),
        });

        // Add grade mappings for this category
        cat.grades.forEach((gradeName) => {
          const gradeId = gradeMap[gradeName];
          if (!gradeId) {
            console.warn(`⚠️ Grade ${gradeName} not found for ${categoryName}`);
            return;
          }

          categoryGradeMappings.push({
            id: uuidv4(),
            product_category_master_id: categoryId,
            grade_id: gradeId,
            created_at: new Date(),
            updated_at: new Date(),
          });
        });
      });

      console.log(
        `✅ Prepared ${categoryRecords.length} shark and ray product categories`
      );
      console.log(`✅ Prepared ${categoryGradeMappings.length} grade mappings`);

      if (categoryRecords.length === 0) {
        console.warn(
          "⚠️ No categories to insert. Check if species/grades exist."
        );
        return;
      }

      // Insert product categories
      await queryInterface.bulkInsert(
        "product_category_master",
        categoryRecords,
        { ignoreDuplicates: true }
      );

      // Insert category to grade mappings only if table exists
      if (categoryGradeMappings.length > 0) {
        try {
          // Check if table exists
          const tables = await queryInterface.sequelize.query(
            `SELECT table_name FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'product_category_to_grade_master'`,
            { raw: true, type: Sequelize.QueryTypes.SELECT }
          );

          if (tables && tables.length > 0) {
            await queryInterface.bulkInsert(
              "product_category_to_grade_master",
              categoryGradeMappings,
              { ignoreDuplicates: true }
            );
            console.log(
              `✅ Inserted ${categoryGradeMappings.length} grade mappings`
            );
          } else {
            console.warn(
              "⚠️ product_category_to_grade_master table does not exist yet. Grade mappings skipped. Please run migrations first."
            );
          }
        } catch (tableCheckError) {
          console.warn(
            "⚠️ Could not check if product_category_to_grade_master table exists:",
            tableCheckError.message
          );
        }
      }

      console.log("✅ Shark and ray product categories seeded successfully!");
    } catch (error) {
      console.error(
        "Error seeding shark and ray product categories:",
        error.message
      );
      throw error;
    }
  },

  down: async (queryInterface) => {
    try {
      // Delete category to grade mappings first (foreign key constraint)
      await queryInterface.sequelize.query(
        `DELETE FROM product_category_to_grade_master 
         WHERE product_category_master_id IN (
           SELECT id FROM product_category_master 
           WHERE product_category LIKE '%Spiny Dogfish%' 
           OR product_category LIKE '%Hammerhead%'
           OR product_category LIKE '%Milk Shark%'
           OR product_category LIKE '%Gummy Shark%'
           OR product_category LIKE '%Blacktip Shark%'
           OR product_category LIKE '%Bull Shark%'
           OR product_category LIKE '%Sandbar Shark%'
           OR product_category LIKE '%Tiger Shark%'
           OR product_category LIKE '%Blue Shark%'
           OR product_category LIKE '%Honeycomb Ray%'
           OR product_category LIKE '%Whip Ray%'
           OR product_category LIKE '%Cow Nose Ray%'
           OR product_category LIKE '%Blue Spotted Ray%'
           OR product_category LIKE '%Mangrove Whip Ray%'
         )`
      );

      // Delete product categories
      await queryInterface.sequelize.query(
        `DELETE FROM product_category_master 
         WHERE product_category LIKE '%Spiny Dogfish%' 
         OR product_category LIKE '%Hammerhead%'
         OR product_category LIKE '%Milk Shark%'
         OR product_category LIKE '%Gummy Shark%'
         OR product_category LIKE '%Blacktip Shark%'
         OR product_category LIKE '%Bull Shark%'
         OR product_category LIKE '%Sandbar Shark%'
         OR product_category LIKE '%Tiger Shark%'
         OR product_category LIKE '%Blue Shark%'
         OR product_category LIKE '%Honeycomb Ray%'
         OR product_category LIKE '%Whip Ray%'
         OR product_category LIKE '%Cow Nose Ray%'
         OR product_category LIKE '%Blue Spotted Ray%'
         OR product_category LIKE '%Mangrove Whip Ray%'`
      );
      console.log(
        "✅ Shark and ray product categories rolled back successfully!"
      );
    } catch (error) {
      console.error(
        "Error rolling back shark and ray product categories:",
        error.message
      );
      throw error;
    }
  },
};
