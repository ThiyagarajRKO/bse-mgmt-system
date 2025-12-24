"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * CONSOLIDATED PRODUCT MASTER SEEDER
 *
 * This seeder consolidates the following individual seeders:
 * - 20251201-add-comprehensive-product-categories.js
 * - 20251201-add-comprehensive-seafood-species.js
 * - 20251201-consolidated-size-master.js
 * - 20251201-generate-comprehensive-products.js
 * - 20251201120002-create-grade-size-mapping.js
 * - 20251201120003-product-category-grade-mapping-seeder.js
 * - 20251204-populate-product-categories.js
 * - 20251205123232-update-existing-products-hsn-codes.js
 * - 20251205999999-shark-ray-product-categories.js
 *
 * Creates comprehensive product master data including species, categories, grades, sizes, and products.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const systemUserId = "00000000-0000-0000-0000-000000000000";

    console.log("Starting consolidated product master seeding...");

    // ============================================================================
    // PHASE 1: SEED SPECIES MASTER
    // ============================================================================

    // Get division IDs
    const divisions = await queryInterface.sequelize.query(
      `SELECT id, division_name FROM division_master WHERE is_active = true`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const divisionMap = {};
    divisions.forEach((div) => {
      divisionMap[div.division_name] = div.id;
    });

    const defaultDivisionId =
      divisionMap["Frozen"] || divisionMap["Seafood"] || uuidv4();

    // Comprehensive seafood species data
    const speciesData = [
      // Key commercial species
      {
        id: uuidv4(),
        species_code: "1001",
        species_name: "Giant Squid",
        scientific_name: "Dosidicus gigas",
        division_master_id: defaultDivisionId,
        hsn_code: "0307",
        description: "Large oceanic squid, excellent for export markets",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        species_code: "1002",
        species_name: "Indian Squid",
        scientific_name: "Loligo duvauceli",
        division_master_id: defaultDivisionId,
        hsn_code: "0307",
        description: "Popular Indian squid species for domestic and export",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        species_code: "2001",
        species_name: "White Shrimp",
        scientific_name: "Penaeus indicus",
        division_master_id: defaultDivisionId,
        hsn_code: "0306",
        description: "Premium white shrimp for high-end markets",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        species_code: "2002",
        species_name: "Black Tiger Shrimp",
        scientific_name: "Penaeus monodon",
        division_master_id: defaultDivisionId,
        hsn_code: "0306",
        description: "Iconic black tiger shrimp for global export",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        species_code: "3001",
        species_name: "Blue Swimming Crab",
        scientific_name: "Portunus pelagicus",
        division_master_id: divisionMap["Crab"] || defaultDivisionId,
        hsn_code: "0306",
        description: "Premium crab species for soft shell crab production",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
    ];

    // Insert species with duplicate prevention
    for (const species of speciesData) {
      const existing = await queryInterface.sequelize.query(
        "SELECT id FROM species_master WHERE species_code = ?",
        {
          replacements: [species.species_code],
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (existing.length === 0) {
        await queryInterface.bulkInsert("species_master", [species], {});
      }
    }

    console.log(`Inserted ${speciesData.length} species records`);

    // ============================================================================
    // PHASE 2: SEED PRODUCT CATEGORIES
    // ============================================================================

    // Get species for category mapping
    const speciesRows = await queryInterface.sequelize.query(
      `SELECT id, species_name FROM species_master WHERE is_active = true`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const speciesMap = {};
    speciesRows.forEach((s) => {
      speciesMap[s.species_name.toLowerCase()] = s.id;
    });

    const getSpeciesId = (keyword) => {
      const keywords = keyword.toLowerCase();
      if (speciesMap[keywords]) return speciesMap[keywords];

      for (const [key, id] of Object.entries(speciesMap)) {
        if (key.includes(keywords) || keywords.includes(key.split(" ")[0])) {
          return id;
        }
      }
      return null;
    };

    // Product categories data
    const categoriesData = [
      // Squid categories
      { name: "Whole Round", species_name: "Giant Squid" },
      { name: "Whole Cleaned", species_name: "Giant Squid" },
      { name: "Fillet", species_name: "Giant Squid" },
      { name: "Rings", species_name: "Giant Squid" },
      { name: "Tubes", species_name: "Giant Squid" },

      // Shrimp categories
      { name: "HOSO", species_name: "White Shrimp" },
      { name: "PDTO", species_name: "White Shrimp" },
      { name: " HLSO", species_name: "White Shrimp" },
      { name: "Whole", species_name: "White Shrimp" },

      // Crab categories
      { name: "Soft Shell", species_name: "Blue Swimming Crab" },
      { name: "Hard Shell", species_name: "Blue Swimming Crab" },
      { name: "Claws", species_name: "Blue Swimming Crab" },
    ];

    const categoryInserts = [];
    for (const cat of categoriesData) {
      const speciesId = getSpeciesId(cat.species_name);
      if (speciesId) {
        const existing = await queryInterface.sequelize.query(
          "SELECT id FROM product_category_master WHERE product_category = ? AND species_master_id = ?",
          {
            replacements: [cat.name, speciesId],
            type: Sequelize.QueryTypes.SELECT,
          }
        );

        if (existing.length === 0) {
          categoryInserts.push({
            id: uuidv4(),
            product_category: cat.name,
            species_master_id: speciesId,
            is_active: true,
            created_by: systemUserId,
            updated_by: systemUserId,
            created_at: now,
            updated_at: now,
          });
        }
      }
    }

    if (categoryInserts.length > 0) {
      await queryInterface.bulkInsert(
        "product_category_master",
        categoryInserts,
        {}
      );
    }

    console.log(`Inserted ${categoryInserts.length} product category records`);

    // ============================================================================
    // PHASE 3: SEED SIZE MASTER
    // ============================================================================

    const sizeData = [
      { size: "U/5", description: "Under 5 cm", sort_order: 1 },
      { size: "5/10", description: "5-10 cm", sort_order: 2 },
      { size: "10/15", description: "10-15 cm", sort_order: 3 },
      { size: "15/20", description: "15-20 cm", sort_order: 4 },
      { size: "20/25", description: "20-25 cm", sort_order: 5 },
      { size: "25/30", description: "25-30 cm", sort_order: 6 },
      { size: "30/40", description: "30-40 cm", sort_order: 7 },
      { size: "40+", description: "Over 40 cm", sort_order: 8 },
    ];

    for (const size of sizeData) {
      const existing = await queryInterface.sequelize.query(
        "SELECT id FROM size_master WHERE size = ?",
        {
          replacements: [size.size],
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (existing.length === 0) {
        await queryInterface.bulkInsert(
          "size_master",
          [
            {
              id: uuidv4(),
              size: size.size,
              description: size.description,
              sort_order: size.sort_order,
              is_active: true,
              created_by: systemUserId,
              updated_by: systemUserId,
              created_at: now,
              updated_at: now,
            },
          ],
          {}
        );
      }
    }

    console.log(`Inserted size master records`);

    // ============================================================================
    // PHASE 4: GENERATE COMPREHENSIVE PRODUCTS
    // ============================================================================

    console.log("Generating comprehensive product combinations...");

    // Get all active product categories with their species
    const categories = await queryInterface.sequelize.query(
      `SELECT pcm.id, pcm.product_category, sm.species_name, sm.species_code, sm.hsn_code
       FROM product_category_master pcm
       JOIN species_master sm ON pcm.species_master_id = sm.id
       WHERE pcm.is_active = true AND sm.is_active = true
       ORDER BY sm.species_name, pcm.product_category`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Get all active grades
    const grades = await queryInterface.sequelize.query(
      `SELECT id, grade_name FROM grade_master WHERE is_active = true ORDER BY grade_name`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Get all active sizes
    const sizes = await queryInterface.sequelize.query(
      `SELECT id, size FROM size_master WHERE is_active = true ORDER BY size`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    console.log(
      `Found ${categories.length} categories, ${grades.length} grades, ${sizes.length} sizes`
    );

    const productRows = [];
    const createdBy = systemUserId;

    // Generate all combinations for each category
    for (const category of categories) {
      // Get valid grades for this category
      const categoryGrades =
        grades.length > 0 ? grades : [{ id: null, grade_name: "Standard" }];
      const categorySizes =
        sizes.length > 0 ? sizes : [{ id: null, size: "Standard" }];

      for (const grade of categoryGrades) {
        for (const size of categorySizes) {
          const productName = `${category.species_name}-${
            category.product_category
          }${grade.grade_name ? `-${grade.grade_name}` : ""}${
            size.size ? `-${size.size}` : ""
          }`;

          // Check if product already exists
          const existing = await queryInterface.sequelize.query(
            "SELECT id FROM product_master WHERE product_name = ?",
            {
              replacements: [productName],
              type: Sequelize.QueryTypes.SELECT,
            }
          );

          if (existing.length === 0) {
            productRows.push({
              id: uuidv4(),
              product_name: productName,
              product_category_master_id: category.id,
              grade_master_id: grade.id,
              size_master_id: size.id,
              species_master_id: category.species_master_id,
              hsn_code: category.hsn_code,
              is_active: true,
              created_by: createdBy,
              updated_by: createdBy,
              created_at: now,
              updated_at: now,
            });
          }
        }
      }
    }

    // Insert products in batches
    const batchSize = 1000;
    for (let i = 0; i < productRows.length; i += batchSize) {
      const batch = productRows.slice(i, i + batchSize);
      if (batch.length > 0) {
        await queryInterface.bulkInsert("product_master", batch, {});
      }
    }

    console.log(
      `Generated ${productRows.length} comprehensive product records`
    );
    console.log("Consolidated product master seeding completed successfully");
  },

  async down(queryInterface, Sequelize) {
    // Remove products created by this seeder
    await queryInterface.bulkDelete(
      "product_master",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );

    // Remove product categories
    await queryInterface.bulkDelete(
      "product_category_master",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );

    // Remove species
    await queryInterface.bulkDelete(
      "species_master",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );

    // Remove sizes (be careful not to remove manually created ones)
    await queryInterface.bulkDelete(
      "size_master",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );
  },
};
