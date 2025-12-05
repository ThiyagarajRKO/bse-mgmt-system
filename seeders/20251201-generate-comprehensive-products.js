"use strict";
const { v4: uuidv4 } = require("uuid");

/**
 * Comprehensive Product Master Seeder
 * Generates all possible product combinations from species, categories, grades, and sizes
 * Product naming format: SPECIES_NAME-PRODUCT_CATEGORY-GRADE-SIZE
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log("Generating comprehensive product combinations...");

      // Get all active product categories with their species
      const categories = await queryInterface.sequelize.query(
        `SELECT pcm.id, pcm.product_category, sm.species_name, sm.species_code
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
      const createdBy = "87ffbaff-b7e9-4198-90d2-0fa12d85ef82";

      // Generate all combinations for each category
      for (const category of categories) {
        // Get valid grades for this category (from category_to_grade_master mapping)
        const categoryGrades = await queryInterface.sequelize.query(
          `SELECT gm.id, gm.grade_name
           FROM grade_master gm
           JOIN product_category_to_grade_master pctgm ON gm.id = pctgm.grade_id
           WHERE pctgm.product_category_master_id = ? AND gm.is_active = true`,
          {
            replacements: [category.id],
            type: Sequelize.QueryTypes.SELECT,
          }
        );

        // If no specific grade mappings exist for this category, use all grades
        const validGrades = categoryGrades.length > 0 ? categoryGrades : grades;

        console.log(
          `Processing ${category.species_name} - ${
            category.product_category
          }: ${validGrades.length} grades × ${sizes.length} sizes = ${
            validGrades.length * sizes.length
          } products`
        );

        // Create product for each grade × size combination
        for (const grade of validGrades) {
          for (const size of sizes) {
            // Generate product name: SPECIES_NAME-PRODUCT_CATEGORY-GRADE-SIZE
            const productName = `${category.species_name
              .replace(/\s+/g, "")
              .toUpperCase()}-${category.product_category
              .replace(/\s+/g, "")
              .toUpperCase()}-${grade.grade_name
              .replace(/\s+/g, "")
              .toUpperCase()}-${size.size.replace(/\s+/g, "").toUpperCase()}`;

            productRows.push({
              id: uuidv4(),
              product_name: productName,
              product_category_master_id: category.id,
              grade_master_id: grade.id,
              size_master_id: size.id,
              is_active: true,
              created_by: createdBy,
              created_at: new Date(),
              updated_at: new Date(),
            });
          }
        }
      }

      if (productRows.length > 0) {
        // Insert in batches to avoid memory issues
        const batchSize = 1000;
        for (let i = 0; i < productRows.length; i += batchSize) {
          const batch = productRows.slice(i, i + batchSize);
          await queryInterface.bulkInsert("product_master", batch, {
            ignoreDuplicates: true,
          });
          console.log(
            `Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
              productRows.length / batchSize
            )} (${batch.length} products)`
          );
        }

        console.log(`✅ Successfully seeded ${productRows.length} products`);
      } else {
        console.log(
          "⚠️ No products to seed - check that categories, grades, and sizes are properly configured"
        );
      }
    } catch (error) {
      console.error("❌ Error seeding products:", error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove dependent records first (foreign key constraints)
      await queryInterface.sequelize.query(
        `DELETE FROM price_list_product_master WHERE product_master_id IS NOT NULL`
      );

      await queryInterface.sequelize.query(
        `DELETE FROM procurement_products WHERE product_master_id IS NOT NULL`
      );

      await queryInterface.sequelize.query(
        `DELETE FROM sales_inventory WHERE product_master_id IS NOT NULL`
      );

      await queryInterface.sequelize.query(
        `DELETE FROM purchase_inventory WHERE product_master_id IS NOT NULL`
      );

      // Now remove all seeded products
      const deletedCount = await queryInterface.bulkDelete(
        "product_master",
        {},
        {}
      );
      console.log(`✅ Removed ${deletedCount} products and related records`);
    } catch (error) {
      console.error("❌ Error removing products:", error);
      throw error;
    }
  },
};
