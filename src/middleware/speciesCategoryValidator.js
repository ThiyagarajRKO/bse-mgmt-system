const path = require("path");
const fs = require("fs");
const { getCategorySizeRules } = require("../utils/categorySizeRulesLoader");

let categorySizeRules = {};
let speciesOverrides = {};
let sequelizeInstance = null;

// Initialize with static rules first
try {
  const staticRules = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../config/category_size_rules.json"),
      "utf8"
    )
  );
  categorySizeRules = staticRules;
  console.log("✅ Loaded static category_size_rules.json");
} catch (e) {
  console.warn("⚠️  category_size_rules.json not found, using defaults");
  categorySizeRules = { Default: ["Small", "Medium", "Large", "XL"] };
}

try {
  speciesOverrides = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../config/species_overrides.json"),
      "utf8"
    )
  );
  // Filter out metadata comments
  Object.keys(speciesOverrides).forEach((key) => {
    if (key.startsWith("_")) delete speciesOverrides[key];
  });
  console.log("✅ Loaded species_overrides.json");
} catch (e) {
  console.warn("⚠️  species_overrides.json not found, no overrides will apply");
  speciesOverrides = {};
}

/**
 * Factory function to create the validator middleware
 * @param {Function} getProductCategoriesBySpecies - DB function to get categories for a species
 * @param {Sequelize} sequelize - Optional database connection for dynamic rules loading
 * Returns: (species_master_id) => Promise<[{id, product_category, parent_category_type}]>
 */
module.exports = function createValidator({
  getProductCategoriesBySpecies,
  sequelize,
}) {
  if (typeof getProductCategoriesBySpecies !== "function") {
    throw new Error(
      "createValidator requires getProductCategoriesBySpecies function"
    );
  }

  // Store sequelize instance for dynamic rules loading
  if (sequelize) {
    sequelizeInstance = sequelize;
    console.log("✅ Sequelize instance provided for dynamic rules loading");
  }

  return async function speciesCategoryValidator(req, reply) {
    try {
      const {
        species_master_id,
        product_category_master_id,
        product_category_id,
        size_code,
        grade_code,
      } = req.body;

      console.log("📋 Validating product creation:", {
        species_master_id,
        product_category_master_id,
        product_category_id,
        size_code,
        grade_code,
      });

      // Use product_category_master_id if available, fallback to product_category_id
      const categoryId = product_category_master_id || product_category_id;

      // 1. Validate required fields
      if (!species_master_id || !categoryId) {
        return reply.status(400).send({
          success: false,
          error:
            "species_master_id and product_category_master_id are required",
        });
      }

      // 2. Get allowed categories for this species from DB
      const allowedCategories = await getProductCategoriesBySpecies(
        species_master_id
      );

      if (!allowedCategories || allowedCategories.length === 0) {
        return reply.status(400).send({
          success: false,
          error: `No product categories found for species ${species_master_id}`,
        });
      }

      console.log(
        `📊 Found ${allowedCategories.length} allowed categories for species`
      );

      // 3. Check if requested category is allowed
      const categoryMatch = allowedCategories.find((c) => c.id === categoryId);
      if (!categoryMatch) {
        const allowedCategoryNames = allowedCategories
          .map((c) => c.product_category)
          .join(", ");
        return reply.status(400).send({
          success: false,
          error: `Product category ${categoryId} not allowed for this species. Allowed: ${allowedCategoryNames}`,
        });
      }

      console.log(`✅ Category ${categoryMatch.product_category} is allowed`);

      // 4. Check size against rules
      if (size_code) {
        const categoryName = categoryMatch.product_category;

        // Check for per-species override first
        const speciesOverride = speciesOverrides[species_master_id];
        let allowedSizes = null;

        if (speciesOverride && speciesOverride.allowed_sizes) {
          allowedSizes = speciesOverride.allowed_sizes;
          console.log(
            `🔧 Using per-species size override: ${allowedSizes.join(", ")}`
          );
        } else {
          // Load dynamic rules if database is available
          if (sequelizeInstance) {
            try {
              const dynamicRules = await getCategorySizeRules(
                sequelizeInstance,
                false
              );
              allowedSizes =
                dynamicRules[categoryName] || dynamicRules["Default"];
              console.log(
                `📊 Using dynamic category sizes from DB: ${allowedSizes.join(
                  ", "
                )}`
              );
            } catch (err) {
              console.warn(
                `⚠️  Failed to load dynamic rules, using static:`,
                err.message
              );
              allowedSizes =
                categorySizeRules[categoryName] || categorySizeRules["Default"];
            }
          } else {
            // Use static rules as fallback
            allowedSizes =
              categorySizeRules[categoryName] || categorySizeRules["Default"];
            console.log(
              `📏 Using static category sizes: ${allowedSizes.join(", ")}`
            );
          }
        }

        if (allowedSizes && !allowedSizes.includes(size_code)) {
          return reply.status(400).send({
            success: false,
            error: `Size '${size_code}' not allowed for category '${categoryName}'. Allowed: ${allowedSizes.join(
              ", "
            )}`,
          });
        }

        console.log(`✅ Size '${size_code}' is allowed`);
      }

      // 5. Check grade against rules (if applicable)
      if (grade_code && speciesOverrides[species_master_id]?.allowed_grades) {
        const allowedGrades =
          speciesOverrides[species_master_id].allowed_grades;
        if (!allowedGrades.includes(grade_code)) {
          return reply.status(400).send({
            success: false,
            error: `Grade '${grade_code}' not allowed for this species. Allowed: ${allowedGrades.join(
              ", "
            )}`,
          });
        }
        console.log(`✅ Grade '${grade_code}' is allowed`);
      }

      // ✅ All validations passed
      req.validated = {
        species_master_id,
        categoryId,
        categoryName: categoryMatch.product_category,
        size_code,
        grade_code,
      };

      console.log("✅ All validations passed, continuing to next handler");
      // For Fastify, just return to continue to next handler
      return;
    } catch (error) {
      console.error("❌ Validation error:", error);
      return reply.status(500).send({
        success: false,
        error: "Internal server error during validation",
      });
    }
  };
};
