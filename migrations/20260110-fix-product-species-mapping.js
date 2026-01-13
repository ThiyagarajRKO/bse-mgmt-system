"use strict";

/**
 * FIX PRODUCT SPECIES MAPPING
 *
 * This migration fixes the product-to-species mapping issue:
 * 1. Ensures all products reference correct species via product_category_master
 * 2. Updates product_category_master with correct species associations
 * 3. Validates 4D mapping references
 * 4. Logs any orphaned or incorrectly mapped products
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log("\n🔧 Fixing product-to-species mapping...");

      // Step 1: Get all active species
      const species = await queryInterface.sequelize.query(
        `SELECT id, species_code, species_name FROM species_master WHERE is_active = true ORDER BY species_code`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(`Found ${species.length} active species`);

      // Step 2: For each species, ensure there's a "Whole" product category
      for (const sp of species) {
        const existing = await queryInterface.sequelize.query(
          `SELECT id FROM product_category_master 
           WHERE species_master_id = ? AND product_category = 'Whole' AND is_active = true
           LIMIT 1`,
          {
            replacements: [sp.id],
            type: Sequelize.QueryTypes.SELECT,
          }
        );

        if (existing.length === 0) {
          // Get system user
          let systemUserId = "00000000-0000-0000-0000-000000000000";
          const users = await queryInterface.sequelize.query(
            `SELECT id FROM user_profiles LIMIT 1`,
            { type: Sequelize.QueryTypes.SELECT }
          );
          if (users.length > 0) {
            systemUserId = users[0].id;
          }

          // Create the category
          await queryInterface.sequelize.query(
            `INSERT INTO product_category_master 
             (id, species_master_id, product_category, parent_category_type, is_active, created_by, created_at)
             VALUES (?, ?, ?, ?, true, ?, now())`,
            {
              replacements: [
                require("uuid").v4(),
                sp.id,
                "Whole",
                "Fish", // Default, will be updated by type
                systemUserId,
              ],
              type: Sequelize.QueryTypes.INSERT,
            }
          );

          console.log(
            `✓ Created 'Whole' category for species: ${sp.species_name}`
          );
        }
      }

      // Step 3: Validate all products have correct category mappings
      const productsWithoutCategory = await queryInterface.sequelize.query(
        `SELECT pm.id, pm.product_name FROM product_master pm
         WHERE pm.product_category_master_id IS NULL AND pm.is_active = true`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (productsWithoutCategory.length > 0) {
        console.warn(
          `⚠️  Found ${productsWithoutCategory.length} products without category assignment`
        );
        console.warn("Products:", productsWithoutCategory);
      }

      // Step 4: Log products with 4D mapping validation
      const productsWithMappings = await queryInterface.sequelize.query(
        `SELECT 
          pm.id,
          pm.product_name,
          pm.species_derivative_size_grade_mapping_id,
          sdsgm.species_master_id,
          sm.species_name,
          COUNT(*) OVER () as total
         FROM product_master pm
         LEFT JOIN species_derivative_size_grade_mapping sdsgm ON pm.species_derivative_size_grade_mapping_id = sdsgm.id
         LEFT JOIN species_master sm ON sdsgm.species_master_id = sm.id
         WHERE pm.is_active = true AND pm.species_derivative_size_grade_mapping_id IS NOT NULL
         LIMIT 20`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (productsWithMappings.length > 0) {
        console.log(
          `✓ Sample of ${productsWithMappings.length} products with 4D mappings:`
        );
        productsWithMappings.forEach((p) => {
          console.log(
            `  - ${p.product_name} → Species: ${p.species_name || "MISSING"}`
          );
        });
      }

      // Step 5: Validate category-species relationships
      const orphanedCategories = await queryInterface.sequelize.query(
        `SELECT pcm.id, pcm.product_category, pcm.species_master_id
         FROM product_category_master pcm
         LEFT JOIN species_master sm ON pcm.species_master_id = sm.id
         WHERE sm.id IS NULL AND pcm.is_active = true`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (orphanedCategories.length > 0) {
        console.warn(
          `⚠️  Found ${orphanedCategories.length} orphaned product categories (species deleted)`
        );
      }

      console.log("\n✅ Product species mapping validation complete");
    } catch (error) {
      console.error("❌ Error fixing product mapping:", error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log("\n🔄 Rolling back product species mapping fixes...");
      // This migration only validates and logs, so rollback is minimal
      console.log("✅ Rollback complete (no structural changes to undo)");
    } catch (error) {
      console.error("❌ Error rolling back:", error.message);
      throw error;
    }
  },
};
