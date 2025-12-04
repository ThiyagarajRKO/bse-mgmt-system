"use strict";

/**
 * Product Categories Seeder
 *
 * Purpose:
 * - Populates default product categories for all species that don't have any
 * - Runs after migrations to ensure tables exist
 * - Can be re-run safely on new environments
 * - Idempotent: won't create duplicates
 *
 * Default Categories:
 * - Whole Fish
 * - Fillets
 * - Steaks
 * - Whole Cleaned
 * - Whole Round
 *
 * Usage:
 * npx sequelize-cli db:seed:all
 * npx sequelize-cli db:seed --seed 20251204-populate-product-categories
 */

const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Default product categories for different species types
      const defaultCategories = [
        "Whole Fish",
        "Fillets",
        "Steaks",
        "Whole Cleaned",
        "Whole Round",
      ];

      // Get a valid user ID from the database (admin/first user)
      const users = await queryInterface.sequelize.query(
        `SELECT id FROM user_profiles LIMIT 1`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (!users || users.length === 0) {
        return;
      }

      const userId = users[0].id;

      // Get all species that don't have any product categories
      const speciesWithoutCategories = await queryInterface.sequelize.query(
        `SELECT s.id, s.species_name, s.parent_category_type 
         FROM species_master s
         WHERE s.id NOT IN (
           SELECT DISTINCT species_master_id FROM product_category_master 
           WHERE deleted_at IS NULL
         )
         AND s.deleted_at IS NULL
         ORDER BY s.created_at ASC`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (speciesWithoutCategories.length === 0) {
        return;
      }

      // Insert default categories for each species without categories
      let categoriesCreated = 0;
      const now = new Date();

      for (const species of speciesWithoutCategories) {
        for (const category of defaultCategories) {
          const categoryId = uuidv4();

          await queryInterface.sequelize.query(
            `INSERT INTO product_category_master 
             (id, species_master_id, product_category, parent_category_type, is_active, created_at, updated_at, created_by)
             VALUES (:id, :speciesId, :category, :parentType, false, :now, :now, :userId)
             ON CONFLICT DO NOTHING`,
            {
              replacements: {
                id: categoryId,
                speciesId: species.id,
                category: category,
                parentType: species.parent_category_type || "Other",
                now: now,
                userId: userId,
              },
              type: queryInterface.sequelize.QueryTypes.INSERT,
            }
          );

          categoriesCreated++;
        }
      }
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Get the default category names
      const defaultCategories = [
        "Whole Fish",
        "Fillets",
        "Steaks",
        "Whole Cleaned",
        "Whole Round",
      ];

      // Delete categories that were created by this seeder
      // We identify them by matching the default category names
      const deletedCount = await queryInterface.sequelize.query(
        `DELETE FROM product_category_master 
         WHERE product_category = ANY(:categories)
         AND deleted_at IS NULL`,
        {
          replacements: {
            categories: defaultCategories,
          },
          type: queryInterface.sequelize.QueryTypes.DELETE,
        }
      );
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  },
};
