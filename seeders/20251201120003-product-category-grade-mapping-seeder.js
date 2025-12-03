"use strict";
const rules = require("../rules");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface) {
    const rows = [];
    const models = require("../models");

    // First, fetch all product categories
    const categories = await models.ProductCategoryMaster.findAll({
      attributes: ["id", "product_category"],
      raw: true,
    });

    // Create a mapping of category names to their IDs
    const categoryMap = {};
    categories.forEach((cat) => {
      categoryMap[cat.product_category] = cat.id;
    });

    // Build rows from rules
    Object.entries(rules.categoryToGrades).forEach(
      ([categoryName, gradeIds]) => {
        const categoryId = categoryMap[categoryName];

        if (categoryId) {
          gradeIds.forEach((gradeId) => {
            rows.push({
              id: uuidv4(),
              product_category_master_id: categoryId,
              grade_id: gradeId,
              created_at: new Date(),
              updated_at: new Date(),
            });
          });
        }
      }
    );

    if (rows.length) {
      await queryInterface.bulkInsert(
        "product_category_to_grade_master",
        rows,
        {}
      );
      console.log(`Seeded ${rows.length} category-grade mappings`);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      "product_category_to_grade_master",
      null,
      {}
    );
  },
};
