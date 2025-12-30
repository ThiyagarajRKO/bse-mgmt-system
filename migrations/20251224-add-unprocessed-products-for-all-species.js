"use strict";

/**
 * Add Unprocessed/Raw Products for All Species
 *
 * BUSINESS FLOW INCORPORATED:
 * =============================
 * 1. PURCHASE: User buys unprocessed (whole) products from suppliers
 *    - Products stored in purchase_inventory
 *    - Product categories: "Whole Round", "Whole Fish", "Whole Crab", etc.
 *    - No grade_master_id or size_master_id (raw state)
 *
 * 2. DISPATCH TO PEELING CENTER: Raw products dispatched to processing facility
 *    - Record in dispatches table
 *    - References original unprocessed product
 *    - Peeling.dispatch_id links to dispatch
 *
 * 3. PEELING & PROCESSING: Center processes products
 *    - Peeling records create PeelingProducts with yield quantities
 *    - Unpeeled/processed products created in product_master
 *    - PeelingProducts reference both input and output products
 *
 * 4. GRADING & SIZING: Processed products are graded and sized
 *    - Output products now have grade_master_id and size_master_id
 *    - PeeledDispatches track products after processing
 *
 * 5. PACKING: Final products are packed
 *    - Packing records group graded/sized products
 *    - Ready for sales
 *
 * THIS MIGRATION:
 * - Creates unprocessed product entries for all active species
 * - Each species gets a "Whole" or species-appropriate unprocessed category
 * - Products have NO grade or size (raw state)
 * - Establishes starting point for the processing workflow
 */

const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log("\n========================================");
      console.log("Adding Unprocessed Products Workflow");
      console.log("========================================\n");

      // Step 1: Get all active species
      console.log("📋 Step 1: Fetching all active species...");
      const species = await queryInterface.sequelize.query(
        "SELECT id, species_name, parent_category_type FROM species_master WHERE is_active = true",
        { type: Sequelize.QueryTypes.SELECT }
      );
      console.log(`✅ Found ${species.length} active species\n`);

      // Step 2: Ensure required product categories exist for unprocessed products
      console.log(
        "📋 Step 2: Ensuring unprocessed product categories exist..."
      );

      // Get system user for created_by
      const users = await queryInterface.sequelize.query(
        "SELECT id FROM user_profiles LIMIT 1",
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (users.length === 0) {
        console.warn("⚠️  No user profiles found. Migration cannot proceed.");
        return;
      }

      const systemUserId = users[0].id;

      // Define unprocessed category types based on parent_category_type
      const categoryTypeMap = {
        Fish: "Whole Fish",
        Crustacean: "Whole Crab",
        Bivalve: "Whole Shell",
        Cephalopod: "Whole",
        Gastropod: "Whole",
        Other: "Whole",
      };

      // Step 3: Get or create product categories for each species
      console.log(
        "📋 Step 3: Processing product categories for each species..."
      );

      const categoryCache = new Map();
      let newCategoriesCount = 0;
      let existingCategoriesCount = 0;

      for (const specie of species) {
        const categoryName =
          categoryTypeMap[specie.parent_category_type] || "Whole";
        const cacheKey = `${specie.id}-${categoryName}`;

        if (!categoryCache.has(cacheKey)) {
          // Check if product category exists for this species
          const existingCategory = await queryInterface.sequelize.query(
            `SELECT id FROM product_category_master 
             WHERE species_master_id = :species_id 
             AND product_category = :category_name
             AND is_active = true
             LIMIT 1`,
            {
              replacements: {
                species_id: specie.id,
                category_name: categoryName,
              },
              type: Sequelize.QueryTypes.SELECT,
            }
          );

          if (existingCategory.length > 0) {
            categoryCache.set(cacheKey, existingCategory[0].id);
            existingCategoriesCount++;
          } else {
            // Create new category
            const categoryId = uuidv4();
            await queryInterface.sequelize.query(
              `INSERT INTO product_category_master 
               (id, species_master_id, product_category, parent_category_type, is_active, created_at, updated_at, created_by)
               VALUES (:id, :species_id, :category_name, :parent_type, true, NOW(), NOW(), :user_id)`,
              {
                replacements: {
                  id: categoryId,
                  species_id: specie.id,
                  category_name: categoryName,
                  parent_type: specie.parent_category_type,
                  user_id: systemUserId,
                },
              }
            );
            categoryCache.set(cacheKey, categoryId);
            newCategoriesCount++;
          }
        }
      }

      console.log(`✅ Created ${newCategoriesCount} new categories`);
      console.log(`✅ Found ${existingCategoriesCount} existing categories\n`);

      // Step 4: Create unprocessed products for each species
      console.log(
        "📋 Step 4: Creating unprocessed products for each species..."
      );

      let createdProductsCount = 0;
      let skippedProductsCount = 0;

      for (const specie of species) {
        const categoryName =
          categoryTypeMap[specie.parent_category_type] || "Whole";
        const cacheKey = `${specie.id}-${categoryName}`;
        const productCategoryId = categoryCache.get(cacheKey);

        const productName = `${specie.species_name} - Unprocessed`;

        // Check if product already exists
        const existingProduct = await queryInterface.sequelize.query(
          `SELECT id FROM product_master 
           WHERE product_category_master_id = :category_id
           AND product_name = :product_name
           AND grade_master_id IS NULL
           AND size_master_id IS NULL
           LIMIT 1`,
          {
            replacements: {
              category_id: productCategoryId,
              product_name: productName,
            },
            type: Sequelize.QueryTypes.SELECT,
          }
        );

        if (existingProduct.length === 0) {
          // Create new unprocessed product
          const productId = uuidv4();
          await queryInterface.sequelize.query(
            `INSERT INTO product_master 
             (id, product_name, product_category_master_id, is_active, created_at, updated_at, created_by)
             VALUES (:id, :product_name, :category_id, true, NOW(), NOW(), :user_id)`,
            {
              replacements: {
                id: productId,
                product_name: productName,
                category_id: productCategoryId,
                user_id: systemUserId,
              },
            }
          );
          createdProductsCount++;
        } else {
          skippedProductsCount++;
        }
      }

      console.log(`✅ Created ${createdProductsCount} unprocessed products`);
      console.log(`✅ Skipped ${skippedProductsCount} existing products\n`);

      // Step 5: Document the workflow process
      console.log("📋 Step 5: Workflow Summary");
      console.log("========================================");
      console.log("UNPROCESSED PRODUCT FLOW:");
      console.log("1. PURCHASE: User buys unprocessed products");
      console.log("   └─ Stored in purchase_inventory table");
      console.log("   └─ Links to product_master (unprocessed variant)");
      console.log("   └─ No grade or size (raw state)");
      console.log("");
      console.log("2. DISPATCH: Products sent to peeling center");
      console.log("   └─ dispatches table records the shipment");
      console.log("   └─ References procurement_product");
      console.log("");
      console.log("3. PROCESSING: Center performs peeling/processing");
      console.log("   └─ peeling table records the process");
      console.log("   └─ peeling_products links input→output products");
      console.log("   └─ yield_quantity tracks usable output");
      console.log("");
      console.log("4. GRADING & SIZING: Processed products classified");
      console.log("   └─ product_master gets grade_master_id & size_master_id");
      console.log("   └─ peeled_dispatches track output");
      console.log("");
      console.log("5. PACKING: Final products packed for sale");
      console.log("   └─ packing table groups graded/sized products");
      console.log("   └─ Ready for sales_inventory");
      console.log("========================================\n");

      console.log("✅ Migration completed successfully!\n");
    } catch (error) {
      console.error("❌ Migration error:", error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log("\nRolling back unprocessed products...");

      // Delete products created for unprocessed items
      await queryInterface.sequelize.query(
        `DELETE FROM product_master 
         WHERE product_name LIKE '%- Unprocessed'
         AND grade_master_id IS NULL 
         AND size_master_id IS NULL`
      );

      // Optionally delete empty categories (those we created)
      await queryInterface.sequelize.query(
        `DELETE FROM product_category_master 
         WHERE product_category IN ('Whole Fish', 'Whole Crab', 'Whole Shell', 'Whole')
         AND NOT EXISTS (
           SELECT 1 FROM product_master 
           WHERE product_category_master_id = product_category_master.id
         )`
      );

      console.log("✅ Rollback completed\n");
    } catch (error) {
      console.error("❌ Rollback error:", error.message);
      throw error;
    }
  },
};
