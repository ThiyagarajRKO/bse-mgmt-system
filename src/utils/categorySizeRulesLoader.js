/**
 * Dynamic Category Size Rules Loader
 *
 * This utility loads size rules from the database instead of hardcoding them.
 * It fetches available sizes from size_master table and maps them to product categories
 * based on category type and business rules.
 *
 * Enhanced Features (v2):
 * - Integration with species_size_mapping for type-aware sizing
 * - Species-based size filtering (e.g., Fish can use pcs/kg, Bivalves use cm)
 * - Intelligent fallback to static rules if database unavailable
 * - Caching with 5-minute TTL for performance
 */

const path = require("path");
const fs = require("fs");
const speciesSizeMapper = require("./speciesSizeMapper");

let cachedRules = null;
let lastLoadTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

/**
 * Get static/fallback rules from JSON file
 * Used as fallback if database is unavailable
 */
function getStaticRules() {
  try {
    const rulesPath = path.join(
      __dirname,
      "../config/category_size_rules.json"
    );
    return JSON.parse(fs.readFileSync(rulesPath, "utf8"));
  } catch (e) {
    console.warn("⚠️  Failed to load static rules:", e.message);
    return getDefaultRules();
  }
}

/**
 * Get default fallback rules
 */
function getDefaultRules() {
  return {
    Default: ["Small", "Medium", "Large", "XL"],
    Whole: ["Small", "Medium", "Large", "Extra Large", "Jumbo"],
    "Whole Cleaned": ["Small", "Medium", "Large"],
    Headless: ["10/20", "16/20", "20/30", "30/40"],
    Peeled: ["16/20", "20/30", "30/40", "40/60"],
  };
}

/**
 * Load dynamic rules from database
 * Maps sizes from size_master to each category
 *
 * @param {Sequelize} sequelize - Database connection
 * @returns {Promise<Object>} Category to sizes mapping
 */
async function loadDynamicRulesFromDB(sequelize) {
  try {
    if (!sequelize) {
      console.warn("⚠️  No database connection provided, using static rules");
      return getStaticRules();
    }

    // Query all active sizes from size_master
    const sizes = await sequelize.query(
      `SELECT id, size, unit_of_measure FROM size_master WHERE is_active = true AND deleted_at IS NULL ORDER BY size ASC`,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!sizes || sizes.length === 0) {
      console.warn("⚠️  No active sizes found in database, using static rules");
      return getStaticRules();
    }

    // Get static rules as base
    const staticRules = getStaticRules();

    // Build dynamic rules by matching sizes
    const dynamicRules = { ...staticRules };

    // Create a map of size names for quick lookup
    const sizeMap = {};
    sizes.forEach((s) => {
      sizeMap[s.size] = s;
    });

    // Group sizes by category
    const sizesByCategory = {
      "Whole Fish": [],
      "Whole Cleaned": [],
      Fillets: [],
      Steaks: [],
      "Whole Round": [],
      Tentacle: [],
      Rings: [],
      Tube: [],
      Headless: [],
      Peeled: [],
      "Peeled and Deveined": [],
      "Claw Meat": [],
      Cluster: [],
      Live: [],
      "Whole Shell": [],
      "Half Shell": [],
      "Meat Only": [],
      "IQF Meat": [],
    };

    // Map sizes to categories based on unit and description
    sizes.forEach((size) => {
      const unit = size.unit_of_measure?.toLowerCase() || "";
      const sizeText = size.size?.toLowerCase() || "";

      // Categorize by unit and size patterns
      if (unit.includes("pcs/kg") || unit.includes("pcs/lb")) {
        // Count-based sizes (like 10/20, 20/30)
        if (
          sizeText.includes("10/20") ||
          sizeText.includes("16/20") ||
          sizeText.includes("20/30")
        ) {
          sizesByCategory.Headless.push(size.size);
          sizesByCategory.Peeled.push(size.size);
        }
        if (sizeText.includes("30/40") || sizeText.includes("40/60")) {
          sizesByCategory.Peeled.push(size.size);
          sizesByCategory["Peeled and Deveined"].push(size.size);
        }
      } else if (unit.includes("g") || unit.includes("kg")) {
        // Weight-based sizes
        if (
          sizeText.includes("jumbo") ||
          sizeText.includes("xl") ||
          sizeText.includes("extra large")
        ) {
          sizesByCategory["Whole Fish"].push(size.size);
          sizesByCategory["Whole Cleaned"].push(size.size);
        } else if (sizeText.includes("large") || sizeText.includes("l (")) {
          sizesByCategory["Whole Fish"].push(size.size);
          sizesByCategory["Whole Cleaned"].push(size.size);
          sizesByCategory.Fillets.push(size.size);
        } else if (sizeText.includes("medium")) {
          sizesByCategory["Whole Cleaned"].push(size.size);
          sizesByCategory.Fillets.push(size.size);
          sizesByCategory.Tentacle.push(size.size);
        } else if (sizeText.includes("small")) {
          sizesByCategory["Whole Cleaned"].push(size.size);
          sizesByCategory.Tentacle.push(size.size);
        }
      } else if (unit.includes("cm")) {
        // Length-based sizes
        if (sizeText.includes(">")) {
          // > symbols indicate larger
          sizesByCategory["Whole Shell"].push(size.size);
          sizesByCategory["Half Shell"].push(size.size);
        } else {
          sizesByCategory["Whole Shell"].push(size.size);
          sizesByCategory["Half Shell"].push(size.size);
          sizesByCategory["Meat Only"].push(size.size);
        }
      }

      // Size codes like T1, T2, T3, T4
      if (sizeText.includes("t1") || sizeText.includes("t2")) {
        sizesByCategory["Tube"].push(size.size);
        sizesByCategory.Rings.push(size.size);
      } else if (sizeText.includes("t3") || sizeText.includes("t4")) {
        sizesByCategory["Tube"].push(size.size);
      }

      // Live sizes
      if (sizeText.includes("1l") || sizeText.includes("2l")) {
        sizesByCategory.Live.push(size.size);
        sizesByCategory.Cluster.push(size.size);
      }

      // Claw meat
      if (sizeText.includes("cluster") || sizeText.includes("claw")) {
        sizesByCategory["Claw Meat"].push(size.size);
      }
    });

    // Update dynamic rules with database sizes (remove empty categories)
    Object.keys(sizesByCategory).forEach((category) => {
      if (sizesByCategory[category].length > 0) {
        dynamicRules[category] = sizesByCategory[category];
      }
    });

    console.log("✅ Loaded dynamic category-size rules from database");
    return dynamicRules;
  } catch (error) {
    console.error(
      "❌ Error loading dynamic rules from database:",
      error.message
    );
    return getStaticRules();
  }
}

/**
 * Get category size rules with caching
 *
 * @param {Sequelize} sequelize - Optional database connection for dynamic loading
 * @param {Boolean} forceRefresh - Force refresh cache
 * @returns {Promise<Object>} Category to sizes mapping
 */
async function getCategorySizeRules(sequelize, forceRefresh = false) {
  const now = Date.now();

  // Return cached rules if still valid
  if (!forceRefresh && cachedRules && now - lastLoadTime < CACHE_DURATION) {
    console.log("📦 Using cached category-size rules");
    return cachedRules;
  }

  // Load fresh rules
  if (sequelize) {
    cachedRules = await loadDynamicRulesFromDB(sequelize);
  } else {
    cachedRules = getStaticRules();
  }

  lastLoadTime = now;
  return cachedRules;
}

/**
 * Get species-specific size recommendations
 *
 * Uses species_size_mapping to return only sizes appropriate for the given species type.
 * This is more intelligent than generic category rules.
 *
 * @param {Sequelize} sequelize - Database connection
 * @param {string} parentCategoryType - Species type (Fish, Bivalve, Crustacean, etc.)
 * @param {boolean} forceRefresh - Force refresh cache
 * @returns {Promise<string[]>} Array of appropriate unit_of_measure values for this species
 *
 * @example
 * const sizesForFish = await getSizesForSpeciesType(sequelize, 'Fish');
 * // Returns: ['g', 'kg', 'pcs/kg', 'pcs/lb']
 */
async function getSizesForSpeciesType(
  sequelize,
  parentCategoryType,
  forceRefresh = false
) {
  try {
    if (!sequelize || !parentCategoryType) {
      console.warn(
        "⚠️  Invalid arguments for getSizesForSpeciesType, using default sizes"
      );
      return ["Small", "Medium", "Large", "XL"];
    }

    // Get sizes from species-size mapping
    const speciesSpecificSizes = await speciesSizeMapper.getSizesForSpecies(
      sequelize,
      parentCategoryType,
      forceRefresh
    );

    console.log(
      `✅ Retrieved ${speciesSpecificSizes.length} sizes for species type: ${parentCategoryType}`,
      speciesSpecificSizes
    );

    return speciesSpecificSizes;
  } catch (error) {
    console.error("❌ Error in getSizesForSpeciesType:", error.message);
    return ["Small", "Medium", "Large", "XL"];
  }
}

/**
 * Get prioritized size recommendations for a species type
 *
 * Returns sizes sorted by priority as defined in species_size_mapping.
 * Lower priority numbers appear first (more recommended).
 *
 * @param {Sequelize} sequelize - Database connection
 * @param {string} parentCategoryType - Species type
 * @param {boolean} forceRefresh - Force refresh cache
 * @returns {Promise<Array>} Array of { unit_of_measure, priority, description }
 *
 * @example
 * const recommendations = await getSpeciesSizeRecommendations(sequelize, 'Fish');
 * // Returns: [
 * //   { unit_of_measure: 'g', priority: 1, description: 'Fish by gram weight...' },
 * //   { unit_of_measure: 'kg', priority: 2, description: 'Fish by kg...' }
 * // ]
 */
async function getSpeciesSizeRecommendations(
  sequelize,
  parentCategoryType,
  forceRefresh = false
) {
  try {
    if (!sequelize || !parentCategoryType) {
      console.warn("⚠️  Invalid arguments for getSpeciesSizeRecommendations");
      return [];
    }

    const recommendations = await speciesSizeMapper.getRecommendedSizes(
      sequelize,
      parentCategoryType,
      forceRefresh
    );

    console.log(
      `✅ Retrieved ${recommendations.length} size recommendations for: ${parentCategoryType}`
    );

    return recommendations;
  } catch (error) {
    console.error("❌ Error in getSpeciesSizeRecommendations:", error.message);
    return [];
  }
}

/**
 * Validate if a size is appropriate for a species type
 *
 * @param {Sequelize} sequelize - Database connection
 * @param {string} parentCategoryType - Species type
 * @param {string} unitOfMeasure - Size unit to validate
 * @param {boolean} forceRefresh - Force refresh cache
 * @returns {Promise<boolean>} True if size is valid for this species
 *
 * @example
 * const isValid = await validateSizeForSpecies(sequelize, 'Fish', 'kg');
 * // Returns: true
 */
async function validateSizeForSpecies(
  sequelize,
  parentCategoryType,
  unitOfMeasure,
  forceRefresh = false
) {
  try {
    if (!sequelize || !parentCategoryType || !unitOfMeasure) {
      return false;
    }

    const isValid = await speciesSizeMapper.validateSizeForSpecies(
      sequelize,
      parentCategoryType,
      unitOfMeasure,
      forceRefresh
    );

    return isValid;
  } catch (error) {
    console.error("❌ Error in validateSizeForSpecies:", error.message);
    return false;
  }
}

/**
 * Clear the cache
 */
function clearCache() {
  cachedRules = null;
  lastLoadTime = 0;
  speciesSizeMapper.clearCache();
  console.log("🗑️  Category size rules cache cleared");
}

module.exports = {
  getCategorySizeRules,
  getStaticRules,
  getDefaultRules,
  loadDynamicRulesFromDB,
  getSizesForSpeciesType,
  getSpeciesSizeRecommendations,
  validateSizeForSpecies,
  clearCache,
};
