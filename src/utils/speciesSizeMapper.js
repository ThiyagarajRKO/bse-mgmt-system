/**
 * SpeciesSizeMapper Utility
 *
 * Provides intelligent species-size mapping with caching, fallback rules,
 * and automatic size recommendation based on species characteristics.
 *
 * Features:
 * - Dynamic loading from database with 5-minute caching
 * - Automatic fallback to hardcoded rules if DB unavailable
 * - Size recommendations prioritized by business rules
 * - Validation of size availability for species types
 * - Comprehensive logging for debugging
 *
 * Usage:
 *   const mapper = require('./speciesSizeMapper');
 *   const allowedSizes = await mapper.getSizesForSpecies(sequelize, parentCategoryType);
 *   const recommendations = await mapper.getRecommendedSizes(sequelize, parentCategoryType);
 */

// Cache storage with TTL
let specieSizeMappingCache = null;
let cacheTimestamp = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get all size units allowed for a specific species type
 *
 * @param {Sequelize} sequelize - Sequelize connection instance
 * @param {string} parentCategoryType - Species type (Bivalve, Cephalopod, Fish, Crustacean, Gastropod, Other)
 * @param {boolean} forceRefresh - Skip cache and fetch from DB
 * @returns {Promise<string[]>} Array of unit_of_measure values allowed for this species
 *
 * @example
 * const sizes = await mapper.getSizesForSpecies(sequelize, 'Fish');
 * // Returns: ['g', 'kg', 'pcs/kg', 'pcs/lb']
 */
async function getSizesForSpecies(
  sequelize,
  parentCategoryType,
  forceRefresh = false
) {
  try {
    if (!parentCategoryType) {
      console.warn(
        "[SpeciesSizeMapper] No parentCategoryType provided, returning empty array"
      );
      return [];
    }

    // Load mappings (with cache)
    const mappings = await getMappingsFromDB(sequelize, forceRefresh);

    if (!mappings || mappings.length === 0) {
      console.warn(
        `[SpeciesSizeMapper] No mappings found for species type: ${parentCategoryType}`
      );
      return [];
    }

    // Filter by parent_category_type and extract unique unit_of_measure values
    const sizes = mappings
      .filter(
        (m) =>
          m.parent_category_type === parentCategoryType && m.is_active === true
      )
      .map((m) => m.unit_of_measure);

    const uniqueSizes = [...new Set(sizes)];

    console.log(
      `[SpeciesSizeMapper] Retrieved ${uniqueSizes.length} sizes for species type: ${parentCategoryType}`,
      uniqueSizes
    );

    return uniqueSizes;
  } catch (error) {
    console.error(
      "[SpeciesSizeMapper] Error in getSizesForSpecies:",
      error.message
    );
    // Return fallback sizes based on species type
    return getStaticSizesForSpecies(parentCategoryType);
  }
}

/**
 * Get size recommendations ordered by priority
 *
 * Returns sizes sorted by priority (lower number = higher priority)
 *
 * @param {Sequelize} sequelize - Sequelize connection instance
 * @param {string} parentCategoryType - Species type
 * @param {boolean} forceRefresh - Skip cache and fetch from DB
 * @returns {Promise<Array>} Array of { unit_of_measure, priority, description } sorted by priority
 *
 * @example
 * const recommendations = await mapper.getRecommendedSizes(sequelize, 'Fish');
 * // Returns: [
 * //   { unit_of_measure: 'g', priority: 1, description: '...' },
 * //   { unit_of_measure: 'kg', priority: 2, description: '...' }
 * // ]
 */
async function getRecommendedSizes(
  sequelize,
  parentCategoryType,
  forceRefresh = false
) {
  try {
    if (!parentCategoryType) {
      console.warn(
        "[SpeciesSizeMapper] No parentCategoryType provided for recommendations"
      );
      return [];
    }

    const mappings = await getMappingsFromDB(sequelize, forceRefresh);

    if (!mappings || mappings.length === 0) {
      console.warn(
        `[SpeciesSizeMapper] No mapping recommendations for: ${parentCategoryType}`
      );
      return [];
    }

    // Filter, sort by priority, and map to recommendation format
    const recommendations = mappings
      .filter(
        (m) =>
          m.parent_category_type === parentCategoryType && m.is_active === true
      )
      .sort((a, b) => (a.priority || 999) - (b.priority || 999))
      .map((m) => ({
        unit_of_measure: m.unit_of_measure,
        priority: m.priority,
        description: m.description || "",
      }));

    console.log(
      `[SpeciesSizeMapper] Retrieved ${recommendations.length} size recommendations for: ${parentCategoryType}`
    );

    return recommendations;
  } catch (error) {
    console.error(
      "[SpeciesSizeMapper] Error in getRecommendedSizes:",
      error.message
    );
    return [];
  }
}

/**
 * Validate if a specific size is allowed for a species type
 *
 * @param {Sequelize} sequelize - Sequelize connection instance
 * @param {string} parentCategoryType - Species type
 * @param {string} unitOfMeasure - Size unit to validate (e.g., 'kg', 'pcs/kg')
 * @param {boolean} forceRefresh - Skip cache and fetch from DB
 * @returns {Promise<boolean>} True if size is allowed for this species type
 *
 * @example
 * const isValid = await mapper.validateSizeForSpecies(sequelize, 'Fish', 'kg');
 * // Returns: true
 */
async function validateSizeForSpecies(
  sequelize,
  parentCategoryType,
  unitOfMeasure,
  forceRefresh = false
) {
  try {
    if (!parentCategoryType || !unitOfMeasure) {
      return false;
    }

    const mappings = await getMappingsFromDB(sequelize, forceRefresh);

    const isValid = mappings.some(
      (m) =>
        m.parent_category_type === parentCategoryType &&
        m.unit_of_measure === unitOfMeasure &&
        m.is_active === true
    );

    console.log(
      `[SpeciesSizeMapper] Size validation - Species: ${parentCategoryType}, Unit: ${unitOfMeasure}, Valid: ${isValid}`
    );

    return isValid;
  } catch (error) {
    console.error(
      "[SpeciesSizeMapper] Error in validateSizeForSpecies:",
      error.message
    );
    return false;
  }
}

/**
 * Get all mapping rules (useful for admin interfaces)
 *
 * @param {Sequelize} sequelize - Sequelize connection instance
 * @param {boolean} forceRefresh - Skip cache and fetch from DB
 * @returns {Promise<Array>} Complete list of all species-size mappings
 */
async function getAllMappings(sequelize, forceRefresh = false) {
  try {
    const mappings = await getMappingsFromDB(sequelize, forceRefresh);
    return mappings || [];
  } catch (error) {
    console.error(
      "[SpeciesSizeMapper] Error in getAllMappings:",
      error.message
    );
    return [];
  }
}

/**
 * Clear the in-memory cache
 * Useful for manual refresh after database updates
 */
function clearCache() {
  specieSizeMappingCache = null;
  cacheTimestamp = null;
  console.log("[SpeciesSizeMapper] Cache cleared");
}

/**
 * Get mappings from database with caching
 * @private
 */
async function getMappingsFromDB(sequelize, forceRefresh = false) {
  try {
    // Check cache validity
    if (
      !forceRefresh &&
      specieSizeMappingCache &&
      cacheTimestamp &&
      Date.now() - cacheTimestamp < CACHE_TTL_MS
    ) {
      console.log("[SpeciesSizeMapper] Returning cached mappings");
      return specieSizeMappingCache;
    }

    console.log("[SpeciesSizeMapper] Fetching mappings from database...");

    // Query the database
    const mappings = await sequelize.models.SpeciesSizeMapping.findAll({
      where: { is_active: true },
      attributes: [
        "id",
        "parent_category_type",
        "unit_of_measure",
        "priority",
        "description",
        "is_active",
      ],
      order: [
        ["parent_category_type", "ASC"],
        ["priority", "ASC"],
      ],
      raw: true,
    });

    // Update cache
    specieSizeMappingCache = mappings;
    cacheTimestamp = Date.now();

    console.log(
      `[SpeciesSizeMapper] Cached ${mappings.length} mappings (TTL: ${CACHE_TTL_MS}ms)`
    );

    return mappings;
  } catch (error) {
    console.error(
      "[SpeciesSizeMapper] Error fetching from database:",
      error.message
    );

    // Log error but don't throw - return cached data or empty array
    if (specieSizeMappingCache) {
      console.warn("[SpeciesSizeMapper] Returning stale cache due to DB error");
      return specieSizeMappingCache;
    }

    console.warn(
      "[SpeciesSizeMapper] No cache available, falling back to static rules"
    );
    return getStaticMappings();
  }
}

/**
 * Static fallback mappings when database is unavailable
 * @private
 */
function getStaticMappings() {
  return [
    // Fish
    {
      id: null,
      parent_category_type: "Fish",
      unit_of_measure: "g",
      priority: 1,
      description: "Fish typically sold by weight in grams",
      is_active: true,
    },
    {
      id: null,
      parent_category_type: "Fish",
      unit_of_measure: "kg",
      priority: 2,
      description: "Fish sold by weight in kilograms",
      is_active: true,
    },
    {
      id: null,
      parent_category_type: "Fish",
      unit_of_measure: "pcs/kg",
      priority: 3,
      description: "Fish sold by count - pieces per kilogram",
      is_active: true,
    },
    {
      id: null,
      parent_category_type: "Fish",
      unit_of_measure: "pcs/lb",
      priority: 4,
      description: "Fish sold by count - pieces per pound",
      is_active: true,
    },

    // Bivalve
    {
      id: null,
      parent_category_type: "Bivalve",
      unit_of_measure: "cm",
      priority: 1,
      description: "Bivalves measured by shell size",
      is_active: true,
    },
    {
      id: null,
      parent_category_type: "Bivalve",
      unit_of_measure: "g",
      priority: 2,
      description: "Bivalves sold by weight",
      is_active: true,
    },
    {
      id: null,
      parent_category_type: "Bivalve",
      unit_of_measure: "kg",
      priority: 3,
      description: "Bivalves sold by bulk weight",
      is_active: true,
    },

    // Crustacean
    {
      id: null,
      parent_category_type: "Crustacean",
      unit_of_measure: "pcs/kg",
      priority: 1,
      description: "Crustaceans sold by count per kilogram",
      is_active: true,
    },
    {
      id: null,
      parent_category_type: "Crustacean",
      unit_of_measure: "pcs/lb",
      priority: 2,
      description: "Crustaceans sold by count per pound",
      is_active: true,
    },
    {
      id: null,
      parent_category_type: "Crustacean",
      unit_of_measure: "kg",
      priority: 3,
      description: "Crustaceans sold by bulk weight",
      is_active: true,
    },
    {
      id: null,
      parent_category_type: "Crustacean",
      unit_of_measure: "g",
      priority: 4,
      description: "Crustaceans sold by weight",
      is_active: true,
    },

    // Cephalopod
    {
      id: null,
      parent_category_type: "Cephalopod",
      unit_of_measure: "kg",
      priority: 1,
      description: "Cephalopods sold by weight",
      is_active: true,
    },
    {
      id: null,
      parent_category_type: "Cephalopod",
      unit_of_measure: "g",
      priority: 2,
      description: "Cephalopods sold by gram weight",
      is_active: true,
    },
    {
      id: null,
      parent_category_type: "Cephalopod",
      unit_of_measure: "pcs/kg",
      priority: 3,
      description: "Cephalopods sold by count per kilogram",
      is_active: true,
    },

    // Gastropod
    {
      id: null,
      parent_category_type: "Gastropod",
      unit_of_measure: "cm",
      priority: 1,
      description: "Gastropods measured by shell size",
      is_active: true,
    },
    {
      id: null,
      parent_category_type: "Gastropod",
      unit_of_measure: "g",
      priority: 2,
      description: "Gastropods sold by weight",
      is_active: true,
    },
    {
      id: null,
      parent_category_type: "Gastropod",
      unit_of_measure: "kg",
      priority: 3,
      description: "Gastropods sold by bulk weight",
      is_active: true,
    },

    // Other
    {
      id: null,
      parent_category_type: "Other",
      unit_of_measure: "g",
      priority: 1,
      description: "Generic gram measurement",
      is_active: true,
    },
    {
      id: null,
      parent_category_type: "Other",
      unit_of_measure: "kg",
      priority: 2,
      description: "Generic kilogram measurement",
      is_active: true,
    },
  ];
}

/**
 * Get static sizes for a specific species type (fallback)
 * @private
 */
function getStaticSizesForSpecies(parentCategoryType) {
  const staticMappings = getStaticMappings();
  return staticMappings
    .filter(
      (m) =>
        m.parent_category_type === parentCategoryType && m.is_active === true
    )
    .map((m) => m.unit_of_measure);
}

module.exports = {
  getSizesForSpecies,
  getRecommendedSizes,
  validateSizeForSpecies,
  getAllMappings,
  clearCache,
};
