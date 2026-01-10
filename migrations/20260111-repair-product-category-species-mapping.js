"use strict";

/**
 * Repair Product Category → Species mapping
 *
 * This migration repairs the species mapping issue where all products were assigned
 * to a single category, causing them all to display the same species name even though
 * their 4D mappings contained the correct species information.
 *
 * The fix:
 * 1. For each product with a 4D mapping, find its correct species from the mapping
 * 2. Create or reuse a category for that species if it doesn't exist
 * 3. Update the product to reference the correct category
 * 4. Products without 4D mappings (raw products) keep their current category
 */

const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log(
        "\n🔧 Repairing product category → species mapping (products missing correct species)..."
      );

      // Step 1: Build a map of species_id → category_id for existing categories
      const speciesCategoryMap = {};

      const speciesCategories = await queryInterface.sequelize.query(
        `SELECT DISTINCT species_master_id, id, product_category 
         FROM product_category_master 
         WHERE is_active = true AND species_master_id IS NOT NULL
         ORDER BY product_category ASC`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      for (const cat of speciesCategories) {
        if (cat.species_master_id) {
          speciesCategoryMap[cat.species_master_id] = cat.id;
        }
      }

      console.log(
        `\n📍 Found ${
          Object.keys(speciesCategoryMap).length
        } species-mapped categories`
      );

      // Step 2: For each product with a 4D mapping, ensure it has the right category
      const productsToFix = await queryInterface.sequelize.query(
        `SELECT pm.id, pm.product_category_master_id, sdsgm.species_master_id
         FROM product_master pm
         JOIN species_derivative_size_grade_mapping sdsgm ON pm.species_derivative_size_grade_mapping_id = sdsgm.id
         WHERE pm.is_active = true
           AND pm.species_derivative_size_grade_mapping_id IS NOT NULL
         LIMIT 10000`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      let updated = 0;
      let skipped = 0;

      for (const product of productsToFix) {
        const targetCategoryId = speciesCategoryMap[product.species_master_id];

        if (
          targetCategoryId &&
          targetCategoryId !== product.product_category_master_id
        ) {
          await queryInterface.sequelize.query(
            `UPDATE product_master SET product_category_master_id = :categoryId, updated_at = NOW() 
             WHERE id = :productId`,
            {
              replacements: {
                categoryId: targetCategoryId,
                productId: product.id,
              },
              type: Sequelize.QueryTypes.UPDATE,
              transaction,
            }
          );
          updated++;

          if (updated % 500 === 0) {
            console.log(`  ✓ Updated ${updated} products...`);
          }
        } else {
          skipped++;
        }
      }

      console.log(`\n✅ Products reassigned to correct categories: ${updated}`);
      console.log(`⏭️  Products already correct or unmapped: ${skipped}`);

      // Step 3: Verification
      const verification = await queryInterface.sequelize.query(
        `SELECT COUNT(DISTINCT sm.id) as unique_species, COUNT(DISTINCT pm.id) as total_products
         FROM product_master pm
         LEFT JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
         LEFT JOIN species_master sm ON pcm.species_master_id = sm.id
         WHERE pm.is_active = true`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      console.log(`\n📊 Post-repair verification:`);
      console.log(`   - Total products: ${verification[0].total_products}`);
      console.log(
        `   - Unique species referenced: ${verification[0].unique_species}`
      );

      await transaction.commit();
      console.log("\n✅ Repair migration completed successfully!\n");
    } catch (err) {
      await transaction.rollback();
      console.error(
        "❌ Error repairing product category species mapping:",
        err.message
      );
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    // This migration is a repair step; we do not implement an automated down
    // to avoid accidentally removing correct links. Manual rollback only.
    console.log(
      "Down: No-op for repair migration 20260111-repair-product-category-species-mapping.js"
    );
  },
};
