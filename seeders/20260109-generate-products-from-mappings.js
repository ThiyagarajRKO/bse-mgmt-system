"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * SEEDER: Generate Products from 4D Mappings with Species & Raw Material Data
 *
 * This seeder:
 * 1. Gets all active 4D mappings (species × derivative × size × grade)
 * 2. For each mapping, creates PROCESSED products with correct species association
 * 3. Links each product to the correct product_category_master for that species
 * 4. Ensures all product names include the correct species name
 * 5. ALSO generates RAW MATERIAL products (UNPROCESSED type)
 * 6. Validates species-to-product relationships
 *
 * Product Categories Generated:
 * - PROCESSED: Species-derivative-size-grade combinations from 4D mappings
 * - RAW MATERIAL: Raw Whole Round for each species × size × grade
 *
 * Processed Product Name Format: [SPECIES NAME] – [DERIVATIVE] – [SIZE] – [GRADE]
 * Example: "Tiger Shrimp – Raw Whole – 10/20 – A"
 *
 * Raw Material Product Name Format: [SPECIES NAME] – Raw Whole Round – [SIZE] – [GRADE]
 * Example: "Tiger Shrimp – Raw Whole Round – 10/20 – A"
 *
 * Each product references:
 * - species_derivative_size_grade_mapping_id (4D mapping for processed only)
 * - product_category_master_id (species category)
 * - species via category association
 * - derivative_master_id (processed products only)
 * - size_master_id
 * - grade_master_id
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log(
        "\n🏭 Generating products from 4D mappings with correct species..."
      );

      // Get system user
      let systemUserId = "00000000-0000-0000-0000-000000000000";
      const users = await queryInterface.sequelize.query(
        `SELECT id FROM user_profiles LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      if (users.length > 0) {
        systemUserId = users[0].id;
      }

      // Check if products already exist
      const existingCount = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM product_master WHERE species_derivative_size_grade_mapping_id IS NOT NULL`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (existingCount[0].count > 0) {
        console.log(
          `✅ ${existingCount[0].count} products already exist, skipping seeder...`
        );
        return;
      }

      // ================================================================
      // Step 1: Get all active 4D mappings with complete details
      // ================================================================
      const mappings = await queryInterface.sequelize.query(
        `
        SELECT 
          sdsgm.id as mapping_id,
          sdsgm.species_master_id,
          sdsgm.derivative_master_id,
          sdsgm.size_master_id,
          sdsgm.grade_master_id,
          s.id as species_id,
          s.species_code,
          s.species_name,
          s.hsn_code,
          d.id as derivative_id,
          d.derivative_code,
          d.derivative_name,
          sz.id as size_id,
          sz.size,
          sz.unit_of_measure,
          g.id as grade_id,
          g.grade_code,
          g.grade_name
        FROM species_derivative_size_grade_mapping sdsgm
        INNER JOIN species_master s ON sdsgm.species_master_id = s.id
        INNER JOIN derivative_master d ON sdsgm.derivative_master_id = d.id
        INNER JOIN size_master sz ON sdsgm.size_master_id = sz.id
        INNER JOIN grade_master g ON sdsgm.grade_master_id = g.id
        WHERE sdsgm.is_active = true AND s.is_active = true
        ORDER BY s.species_code, d.derivative_code, sz.size, g.grade_code
        `,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(
        `\n📋 Found ${mappings.length} active 4D mappings to convert to products`
      );

      if (mappings.length === 0) {
        console.log("❌ No mappings found!");
        await transaction.rollback();
        return;
      }

      // ================================================================
      // Step 2: Build species-to-category mapping (Create if missing)
      // ================================================================
      console.log("\n🗂️  Building species-to-category mapping...");

      const speciesCategoryMap = {};
      const speciesNameMap = {}; // Cache species names for category creation
      const uniqueSpecies = [...new Set(mappings.map((m) => m.species_id))];

      // First, get species names for all unique species
      const speciesData = await queryInterface.sequelize.query(
        `
        SELECT id, species_name, species_code
        FROM species_master
        WHERE id IN (${uniqueSpecies.map(() => "?").join(",")})
          AND is_active = true
        `,
        { replacements: uniqueSpecies, type: Sequelize.QueryTypes.SELECT }
      );

      speciesData.forEach((s) => {
        speciesNameMap[s.id] = {
          name: s.species_name,
          code: s.species_code,
        };
      });

      // Build categories for each species (create if doesn't exist)
      let categoriesCreated = 0;

      for (const speciesId of uniqueSpecies) {
        // First check if category exists
        const existingCategories = await queryInterface.sequelize.query(
          `
          SELECT id, product_category, species_master_id
          FROM product_category_master
          WHERE species_master_id = ? AND is_active = true
          ORDER BY created_at ASC
          LIMIT 1
          `,
          { replacements: [speciesId], type: Sequelize.QueryTypes.SELECT }
        );

        if (existingCategories.length > 0) {
          speciesCategoryMap[speciesId] = existingCategories[0].id;
        } else {
          // Create a new category for this species
          const speciesInfo = speciesNameMap[speciesId];
          if (speciesInfo) {
            const categoryId = uuidv4();
            const categoryName = `${speciesInfo.name} - Processed`;

            await queryInterface.insert(
              null,
              "product_category_master",
              {
                id: categoryId,
                product_category: categoryName,
                product_category_description: `Processed products category for ${speciesInfo.name}`,
                species_master_id: speciesId,
                is_active: true,
                created_by: systemUserId,
                updated_by: systemUserId,
                created_at: new Date(),
                updated_at: new Date(),
              },
              { transaction }
            );

            speciesCategoryMap[speciesId] = categoryId;
            categoriesCreated++;
            console.log(
              `   ✓ Created category: ${categoryName} for species ${speciesId}`
            );
          } else {
            console.warn(
              `⚠️  Could not find species info for ID: ${speciesId}`
            );
            speciesCategoryMap[speciesId] = null;
          }
        }
      }

      console.log(
        `✓ Mapped ${
          Object.keys(speciesCategoryMap).length
        } species to categories (${categoriesCreated} created)`
      );

      // ================================================================
      // Step 3: Generate products with correct species mapping
      // ================================================================
      console.log("\n🏗️  Generating products...");

      const products = [];
      const productDetails = [];
      const now = new Date();
      const errors = [];

      for (const mapping of mappings) {
        try {
          // Validate category exists for this species
          const categoryId = speciesCategoryMap[mapping.species_id];
          if (!categoryId) {
            errors.push(
              `Missing category for species: ${mapping.species_name} (ID: ${mapping.species_id})`
            );
            continue;
          }

          // Generate product name with CORRECT SPECIES NAME
          const productName = `${mapping.species_name} – ${mapping.derivative_name} – ${mapping.size} – ${mapping.grade_name}`;

          // Generate SKU for reference
          const sku = `${mapping.species_code}-${mapping.derivative_code}-${mapping.size}-${mapping.grade_code}`;

          const productId = uuidv4();

          const product = {
            id: productId,
            product_name: productName,
            product_category_master_id: categoryId,
            size_master_id: mapping.size_id,
            grade_master_id: mapping.grade_id,
            derivative_master_id: mapping.derivative_id,
            species_derivative_size_grade_mapping_id: mapping.mapping_id,
            hsn_code: mapping.hsn_code,
            is_active: true,
            created_by: systemUserId,
            updated_by: systemUserId,
            created_at: now,
            updated_at: now,
            processing_state: "PROCESSED",
            product_role: "FINISHED_GOOD",
            is_raw: false,
            packaging_master_id: null,
          };

          products.push(product);

          // Track product details for logging
          productDetails.push({
            sku,
            productName,
            species: mapping.species_name,
            category: mapping.derivative_name,
            size: mapping.size,
            grade: mapping.grade_name,
          });

          // Progress logging
          if (products.length % 500 === 0) {
            console.log(`  ⏳ Generated ${products.length} products...`);
          }
        } catch (err) {
          errors.push(
            `Error processing mapping ${mapping.mapping_id}: ${err.message}`
          );
        }
      }

      if (errors.length > 0) {
        console.warn(`\n⚠️  Encountered ${errors.length} errors:`);
        errors.slice(0, 10).forEach((e) => console.warn(`  - ${e}`));
        if (errors.length > 10) {
          console.warn(`  ... and ${errors.length - 10} more`);
        }
      }

      // ================================================================
      // Step 4: Batch insert all products
      // ================================================================
      console.log(
        `\n💾 Inserting ${products.length} products into product_master...`
      );

      const batchSize = 500;
      let insertedCount = 0;

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        await queryInterface.bulkInsert("product_master", batch, {
          transaction,
        });
        insertedCount += batch.length;
        console.log(
          `  ✓ Inserted ${insertedCount}/${products.length} products`
        );
      }

      // ================================================================
      // Step 5: Validation and logging
      // ================================================================
      console.log("\n✅ Product generation complete!");
      console.log(`   📊 Total products created: ${products.length}`);

      // Show sample products
      if (productDetails.length > 0) {
        console.log("\n📋 Sample generated products:");
        productDetails.slice(0, 5).forEach((p) => {
          console.log(`   ✓ ${p.productName}`);
        });
        if (productDetails.length > 5) {
          console.log(`   ... and ${productDetails.length - 5} more`);
        }
      }

      // ================================================================
      // Step 6: Verify species-product associations
      // ================================================================
      const verification = await queryInterface.sequelize.query(
        `
        SELECT 
          COUNT(pm.id) as total_products,
          COUNT(DISTINCT s.id) as unique_species,
          COUNT(DISTINCT d.id) as unique_derivatives,
          COUNT(DISTINCT sz.id) as unique_sizes,
          COUNT(DISTINCT g.id) as unique_grades
        FROM product_master pm
        LEFT JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
        LEFT JOIN species_master s ON pcm.species_master_id = s.id
        LEFT JOIN derivative_master d ON pm.derivative_master_id = d.id
        LEFT JOIN size_master sz ON pm.size_master_id = sz.id
        LEFT JOIN grade_master g ON pm.grade_master_id = g.id
        WHERE pm.is_active = true AND pm.species_derivative_size_grade_mapping_id IS NOT NULL
        `,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log("\n📊 Verification Report (Processed Products):");
      console.log(`   Total Products: ${verification[0].total_products}`);
      console.log(`   Unique Species: ${verification[0].unique_species}`);
      console.log(
        `   Unique Derivatives: ${verification[0].unique_derivatives}`
      );
      console.log(`   Unique Sizes: ${verification[0].unique_sizes}`);
      console.log(`   Unique Grades: ${verification[0].unique_grades}`);

      // ================================================================
      // Step 7: Generate RAW MATERIAL products (UNPROCESSED)
      // ================================================================
      console.log("\n🧊 Generating RAW MATERIAL (UNPROCESSED) products...");

      // Get all species, sizes, and grades for raw material
      const rawMaterialData = await queryInterface.sequelize.query(
        `
        SELECT DISTINCT
          s.id as species_id,
          s.species_code,
          s.species_name,
          s.hsn_code,
          sz.id as size_id,
          sz.size,
          sz.unit_of_measure,
          g.id as grade_id,
          g.grade_code,
          g.grade_name
        FROM species_master s
        CROSS JOIN size_master sz
        CROSS JOIN grade_master g
        WHERE s.is_active = true 
          AND sz.is_active = true 
          AND g.is_active = true
        ORDER BY s.species_code, sz.size, g.grade_code
        `,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(
        `\n🌾 Found ${rawMaterialData.length} raw material combinations`
      );

      // Get or create RAW WHOLE ROUND derivative
      const rawWholeDeriv = await queryInterface.sequelize.query(
        `SELECT id FROM derivative_master 
         WHERE derivative_code = 'RAW_WHOLE_ROUND' AND is_active = true LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      const rawWholeDerivId =
        rawWholeDeriv.length > 0 ? rawWholeDeriv[0].id : null;

      if (!rawWholeDerivId) {
        console.warn(
          "⚠️  RAW_WHOLE_ROUND derivative not found. Skipping raw materials."
        );
      } else {
        const rawProducts = [];
        const rawProductDetails = [];
        let rawProductCount = 0;

        for (const rawMat of rawMaterialData) {
          try {
            // Get category for species
            const categoryId = speciesCategoryMap[rawMat.species_id];
            if (!categoryId) {
              continue;
            }

            // Generate raw material product name
            const rawProductName = `${rawMat.species_name} – Raw Whole Round – ${rawMat.size} – ${rawMat.grade_name}`;

            const rawProduct = {
              id: uuidv4(),
              product_name: rawProductName,
              product_category_master_id: categoryId,
              size_master_id: rawMat.size_id,
              grade_master_id: rawMat.grade_id,
              derivative_master_id: rawWholeDerivId,
              // No 4D mapping for raw materials (they are standalone)
              species_derivative_size_grade_mapping_id: null,
              hsn_code: rawMat.hsn_code,
              is_active: true,
              created_by: systemUserId,
              updated_by: systemUserId,
              created_at: now,
              updated_at: now,
              // Raw material state
              processing_state: "RAW",
              product_role: "RAW_MATERIAL",
              is_raw: true,
              packaging_master_id: null,
            };

            rawProducts.push(rawProduct);
            rawProductDetails.push({
              productName: rawProductName,
              species: rawMat.species_name,
              size: rawMat.size,
              grade: rawMat.grade_name,
              type: "RAW_MATERIAL",
            });

            rawProductCount++;

            if (rawProductCount % 500 === 0) {
              console.log(
                `  ⏳ Generated ${rawProductCount} raw material products...`
              );
            }
          } catch (err) {
            console.warn(`⚠️  Error processing raw material: ${err.message}`);
          }
        }

        if (rawProducts.length > 0) {
          console.log(
            `\n💾 Inserting ${rawProducts.length} raw material products...`
          );

          // Batch insert raw products
          const rawBatchSize = 500;
          let rawInsertedCount = 0;

          for (let i = 0; i < rawProducts.length; i += rawBatchSize) {
            const batch = rawProducts.slice(i, i + rawBatchSize);
            await queryInterface.bulkInsert("product_master", batch, {
              transaction,
            });
            rawInsertedCount += batch.length;
            console.log(
              `  ✓ Inserted ${rawInsertedCount}/${rawProducts.length} raw material products`
            );
          }

          console.log("\n✅ Raw material product generation complete!");
          console.log(
            `   🌾 Total raw material products created: ${rawProducts.length}`
          );

          // Show sample raw products
          if (rawProductDetails.length > 0) {
            console.log("\n📋 Sample raw material products:");
            rawProductDetails.slice(0, 5).forEach((p) => {
              console.log(`   ✓ ${p.productName}`);
            });
            if (rawProductDetails.length > 5) {
              console.log(`   ... and ${rawProductDetails.length - 5} more`);
            }
          }

          // Verify raw material products
          const rawVerif = await queryInterface.sequelize.query(
            `
            SELECT 
              COUNT(pm.id) as total_raw,
              COUNT(DISTINCT s.id) as unique_species_raw,
              COUNT(DISTINCT sz.id) as unique_sizes_raw,
              COUNT(DISTINCT g.id) as unique_grades_raw
            FROM product_master pm
            LEFT JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
            LEFT JOIN species_master s ON pcm.species_master_id = s.id
            LEFT JOIN size_master sz ON pm.size_master_id = sz.id
            LEFT JOIN grade_master g ON pm.grade_master_id = g.id
            WHERE pm.is_active = true AND pm.species_derivative_size_grade_mapping_id IS NULL AND pm.is_raw = true
            `,
            { type: Sequelize.QueryTypes.SELECT }
          );

          console.log("\n📊 Verification Report (Raw Material Products):");
          console.log(`   Total Raw Products: ${rawVerif[0].total_raw}`);
          console.log(`   Unique Species: ${rawVerif[0].unique_species_raw}`);
          console.log(`   Unique Sizes: ${rawVerif[0].unique_sizes_raw}`);
          console.log(`   Unique Grades: ${rawVerif[0].unique_grades_raw}`);
        }
      }

      // ================================================================
      // Step 8: FINAL SUMMARY
      // ================================================================
      const totalProducts = await queryInterface.sequelize.query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_raw = true THEN 1 ELSE 0 END) as raw_count,
          SUM(CASE WHEN is_raw = false THEN 1 ELSE 0 END) as processed_count
         FROM product_master WHERE is_active = true`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log("\n" + "=".repeat(60));
      console.log("🎉 COMPLETE PRODUCT GENERATION SUMMARY");
      console.log("=".repeat(60));
      console.log(`Total Products Created: ${totalProducts[0].total}`);
      console.log(
        `  ├─ Processed Products: ${totalProducts[0].processed_count}`
      );
      console.log(`  └─ Raw Material Products: ${totalProducts[0].raw_count}`);
      console.log("=".repeat(60) + "\n");

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Error generating products:", error.message);
      console.error(error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log("\n🔄 Removing generated products from 4D mappings...");

      const deletedCount = await queryInterface.sequelize.query(
        `DELETE FROM product_master 
         WHERE species_derivative_size_grade_mapping_id IS NOT NULL
         RETURNING id`,
        { transaction }
      );

      console.log(
        `✅ Removed ${deletedCount[0]?.length || 0} products from 4D mappings`
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Error removing products:", error.message);
      throw error;
    }
  },
};
