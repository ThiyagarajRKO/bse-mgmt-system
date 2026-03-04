"use strict";

/**
 * SPECIES × DERIVATIVE × SIZE × GRADE VALIDATOR
 *
 * Validates 4-dimensional product combinations:
 * - Species (Fish, Shrimp, Tuna, etc.)
 * - Derivative (Whole, Fillet, Loin, etc.)
 * - Size (0.5-2kg, 2-5kg, 10-15/kg, etc.)
 * - Grade (A, B, C, D)
 *
 * Returns:
 * - Viability assessment
 * - Market segment recommendation
 * - Processing requirements
 * - Storage/shelf life info
 * - Cost calculation with yield
 * - Certification requirements
 */

const models = require("../../models");

/**
 * Validate a 4D product combination
 * @param {UUID} speciesId
 * @param {UUID} derivativeId
 * @param {UUID} sizeId
 * @param {UUID} gradeId
 * @returns {Promise<{valid, viable, mapping, recommendations, processing_info, storage_info}>}
 */
async function validateCombination(speciesId, derivativeId, sizeId, gradeId) {
  try {
    const mapping = await models.species_derivative_size_grade_mapping.findOne({
      where: {
        species_master_id: speciesId,
        derivative_master_id: derivativeId,
        size_master_id: sizeId,
        grade_master_id: gradeId,
        is_active: true,
      },
      include: [
        {
          association: "species",
          attributes: ["species_name", "species_code"],
        },
        {
          association: "derivative",
          attributes: ["derivative_name", "derivative_code"],
        },
        { association: "size", attributes: ["size_name"] },
        { association: "grade", attributes: ["grade_name", "grade_code"] },
      ],
    });

    if (!mapping) {
      return {
        valid: false,
        viable: false,
        mapping: null,
        reason: "Combination not found in database",
        recommendations: null,
        processing_info: null,
        storage_info: null,
      };
    }

    if (!mapping.is_viable) {
      return {
        valid: false,
        viable: false,
        mapping: mapping,
        reason: mapping.viability_reason,
        recommendations: null,
        processing_info: null,
        storage_info: null,
      };
    }

    return {
      valid: true,
      viable: true,
      mapping: mapping,
      reason: "Combination is viable and production-ready",
      recommendations: {
        market_segment: mapping.market_segment,
        pricing_tier: mapping.pricing_tier,
        expected_margin: calculateMargin(mapping.pricing_tier),
      },
      processing_info: {
        difficulty: mapping.processing_difficulty,
        expected_yield_percent: mapping.expected_yield_percent,
        weight_loss_percent_thaw: mapping.weight_loss_percent_thaw,
      },
      storage_info: {
        temperature_celsius: mapping.storage_temperature_celsius,
        shelf_life_days: mapping.shelf_life_days,
        recommended_packaging: mapping.packaging_type_preferred,
        certifications_required: mapping.certification_requirements,
      },
    };
  } catch (error) {
    console.error("Combination validation error:", error);
    return {
      valid: false,
      viable: false,
      mapping: null,
      reason: "Validation service error",
      recommendations: null,
      processing_info: null,
      storage_info: null,
    };
  }
}

/**
 * Get all viable combinations for a species
 * @param {UUID} speciesId
 * @returns {Promise<Array>}
 */
async function getViableForSpecies(speciesId) {
  try {
    return await models.species_derivative_size_grade_mapping.findAll({
      where: {
        species_master_id: speciesId,
        is_viable: true,
        is_active: true,
      },
      include: [
        {
          association: "derivative",
          attributes: ["derivative_name", "derivative_code"],
        },
        { association: "size", attributes: ["size_name"] },
        { association: "grade", attributes: ["grade_name", "grade_code"] },
      ],
      order: [["market_segment", "ASC"]],
    });
  } catch (error) {
    console.error("Error fetching species combinations:", error);
    return [];
  }
}

/**
 * Get all combinations for a market segment with cost calculations
 * @param {string} marketSegment - Premium, Export, Processing, etc.
 * @param {number} rawMaterialCost - Cost per kg/unit of raw material
 * @returns {Promise<Array>}
 */
async function getMarketCombinations(marketSegment, rawMaterialCost = null) {
  try {
    const combinations =
      await models.species_derivative_size_grade_mapping.findAll({
        where: {
          market_segment: marketSegment,
          is_viable: true,
          is_active: true,
        },
        include: [
          { association: "species", attributes: ["species_name"] },
          { association: "derivative", attributes: ["derivative_name"] },
          { association: "size", attributes: ["size_name"] },
          { association: "grade", attributes: ["grade_name", "grade_code"] },
        ],
        order: [["pricing_tier", "ASC"]],
      });

    if (rawMaterialCost) {
      return combinations.map((combo) => ({
        ...combo.toJSON(),
        processed_cost:
          models.species_derivative_size_grade_mapping.calculateProcessedCost(
            rawMaterialCost,
            combo
          ),
      }));
    }

    return combinations;
  } catch (error) {
    console.error("Error fetching market combinations:", error);
    return [];
  }
}

/**
 * Get market recommendations for a partial combination
 * (Species + Derivative + Size) → Shows all viable grades
 * @param {UUID} speciesId
 * @param {UUID} derivativeId
 * @param {UUID} sizeId
 * @returns {Promise<Array>}
 */
async function getGradeRecommendations(speciesId, derivativeId, sizeId) {
  try {
    return await models.species_derivative_size_grade_mapping.findAll({
      where: {
        species_master_id: speciesId,
        derivative_master_id: derivativeId,
        size_master_id: sizeId,
        is_viable: true,
        is_active: true,
      },
      include: [
        {
          association: "grade",
          attributes: ["id", "grade_name", "grade_code"],
        },
      ],
      order: [["pricing_tier", "ASC"]],
    });
  } catch (error) {
    console.error("Error fetching grade recommendations:", error);
    return [];
  }
}

/**
 * Calculate cost with yield and thaw loss
 * @param {number} rawCost
 * @param {Object} mapping
 * @returns {number}
 */
function calculateCost(rawCost, mapping) {
  const yieldFactor = mapping.expected_yield_percent / 100;
  const thawLossFactor = (100 - mapping.weight_loss_percent_thaw) / 100;
  return rawCost / (yieldFactor * thawLossFactor);
}

/**
 * Calculate margin based on pricing tier
 * @param {string} pricingTier
 * @returns {number} margin percentage
 */
function calculateMargin(pricingTier) {
  const margins = {
    Premium: 45,
    Standard: 35,
    Value: 25,
    Economy: 15,
  };
  return margins[pricingTier] || 30;
}

/**
 * Get processing requirements for a combination
 * @param {Object} mapping
 * @returns {Object}
 */
function getProcessingRequirements(mapping) {
  const requirements = {
    difficulty: mapping.processing_difficulty,
    yield_percent: mapping.expected_yield_percent,
    weight_loss_thaw: mapping.weight_loss_percent_thaw,
    labor_intensive:
      mapping.processing_difficulty === "Hard" ||
      mapping.processing_difficulty === "Very_Hard",
    equipment_needed:
      mapping.processing_difficulty === "Very_Hard"
        ? ["Specialized knives", "Vacuum sealer", "IQF equipment"]
        : mapping.processing_difficulty === "Hard"
        ? ["Sharp knives", "Vacuum sealer"]
        : ["Basic knives", "Storage freezer"],
  };

  return requirements;
}

module.exports = {
  validateCombination,
  getViableForSpecies,
  getMarketCombinations,
  getGradeRecommendations,
  calculateCost,
  calculateMargin,
  getProcessingRequirements,
};
