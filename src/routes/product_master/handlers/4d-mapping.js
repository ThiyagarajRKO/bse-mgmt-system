"use strict";

/**
 * API HANDLERS: Species × Derivative × Size × Grade Mapping
 *
 * Endpoints:
 * 1. POST /product-master/validate-combination - Validate 4D combination
 * 2. GET /product-master/species/:id/viable-combinations - All viable for species
 * 3. GET /product-master/market/:segment/combinations - All combinations by market
 * 4. POST /product-master/grade-recommendations - Get viable grades for species+deriv+size
 */

const {
  validateCombination,
  getViableForSpecies,
  getMarketCombinations,
  getGradeRecommendations,
  calculateCost,
  getProcessingRequirements,
} = require("../../utils/speciesDerivativeSizeGradeValidator");

/**
 * Handler 1: Validate a complete 4D combination
 * POST /product-master/validate-combination
 */
async function validateCombination_Handler(request, reply) {
  try {
    const { species_id, derivative_id, size_id, grade_id, raw_material_cost } =
      request.body;

    // Validate inputs
    if (!species_id || !derivative_id || !size_id || !grade_id) {
      return reply.status(400).send({
        error: true,
        message:
          "Missing required: species_id, derivative_id, size_id, grade_id",
      });
    }

    const result = await validateCombination(
      species_id,
      derivative_id,
      size_id,
      grade_id
    );

    if (!result.valid) {
      return reply.status(400).send({
        error: true,
        message: result.reason,
        viable: result.viable,
      });
    }

    // Calculate cost if raw material cost provided
    let costAnalysis = null;
    if (raw_material_cost && raw_material_cost > 0) {
      const processedCost = calculateCost(raw_material_cost, result.mapping);
      costAnalysis = {
        raw_material_cost: raw_material_cost,
        processed_cost: parseFloat(processedCost.toFixed(2)),
        cost_increase_percent: parseFloat(
          (
            ((processedCost - raw_material_cost) / raw_material_cost) *
            100
          ).toFixed(1)
        ),
      };
    }

    return reply.status(200).send({
      valid: true,
      viable: true,
      combination: {
        species: result.mapping.species.species_name,
        derivative: result.mapping.derivative.derivative_name,
        size: result.mapping.size.size_name,
        grade: result.mapping.grade.grade_name,
      },
      market_segment: result.recommendations.market_segment,
      pricing_tier: result.recommendations.pricing_tier,
      expected_margin_percent: result.recommendations.expected_margin,
      processing: result.processing_info,
      storage: result.storage_info,
      cost_analysis: costAnalysis,
      message: "Combination validated and approved for production",
    });
  } catch (error) {
    console.error("Combination validation error:", error);
    return reply.status(500).send({
      error: true,
      message: "Validation service error",
      details: error.message,
    });
  }
}

/**
 * Handler 2: Get all viable combinations for a species
 * GET /product-master/species/:id/viable-combinations
 */
async function getViableForSpecies_Handler(request, reply) {
  try {
    const { id: speciesId } = request.params;

    if (!speciesId) {
      return reply.status(400).send({
        error: true,
        message: "Species ID required",
      });
    }

    const combinations = await getViableForSpecies(speciesId);

    if (combinations.length === 0) {
      return reply.status(404).send({
        error: true,
        message: "No viable combinations found for this species",
      });
    }

    // Group by market segment
    const grouped = combinations.reduce((acc, combo) => {
      const segment = combo.market_segment || "Other";
      if (!acc[segment]) acc[segment] = [];
      acc[segment].push({
        derivative: combo.derivative.derivative_name,
        size: combo.size.size_name,
        grade: combo.grade.grade_name,
        pricing_tier: combo.pricing_tier,
        yield_percent: combo.expected_yield_percent,
        difficulty: combo.processing_difficulty,
      });
      return acc;
    }, {});

    return reply.status(200).send({
      species_id: speciesId,
      total_combinations: combinations.length,
      by_market_segment: grouped,
    });
  } catch (error) {
    console.error("Get viable combinations error:", error);
    return reply.status(500).send({
      error: true,
      message: "Service error",
      details: error.message,
    });
  }
}

/**
 * Handler 3: Get all combinations for a market segment
 * GET /product-master/market/:segment/combinations
 */
async function getMarketCombinations_Handler(request, reply) {
  try {
    const { segment } = request.params;
    const { raw_material_cost } = request.query;

    if (!segment) {
      return reply.status(400).send({
        error: true,
        message: "Market segment required (Premium, Export, Processing, etc.)",
      });
    }

    const combinations = await getMarketCombinations(
      segment,
      raw_material_cost ? parseFloat(raw_material_cost) : null
    );

    if (combinations.length === 0) {
      return reply.status(404).send({
        error: true,
        message: `No combinations found for market segment: ${segment}`,
      });
    }

    return reply.status(200).send({
      market_segment: segment,
      total_combinations: combinations.length,
      combinations: combinations.map((combo) => ({
        species: combo.species.species_name,
        derivative: combo.derivative.derivative_name,
        size: combo.size.size_name,
        grade: combo.grade.grade_name,
        pricing_tier: combo.pricing_tier,
        yield_percent: combo.expected_yield_percent,
        shelf_life_days: combo.shelf_life_days,
        storage_temperature: combo.storage_temperature_celsius,
        certifications: combo.certification_requirements,
        processed_cost:
          combo.processed_cost && parseFloat(combo.processed_cost.toFixed(2)),
      })),
    });
  } catch (error) {
    console.error("Get market combinations error:", error);
    return reply.status(500).send({
      error: true,
      message: "Service error",
      details: error.message,
    });
  }
}

/**
 * Handler 4: Get viable grades for a partial combination
 * POST /product-master/grade-recommendations
 */
async function getGradeRecommendations_Handler(request, reply) {
  try {
    const { species_id, derivative_id, size_id } = request.body;

    if (!species_id || !derivative_id || !size_id) {
      return reply.status(400).send({
        error: true,
        message: "Missing required: species_id, derivative_id, size_id",
      });
    }

    const recommendations = await getGradeRecommendations(
      species_id,
      derivative_id,
      size_id
    );

    if (recommendations.length === 0) {
      return reply.status(404).send({
        error: true,
        message:
          "No viable grades found for this species-derivative-size combination",
      });
    }

    return reply.status(200).send({
      species_id: species_id,
      derivative_id: derivative_id,
      size_id: size_id,
      available_grades: recommendations.map((rec) => ({
        grade_id: rec.grade.id,
        grade_code: rec.grade.grade_code,
        grade_name: rec.grade.grade_name,
        market_segment: rec.market_segment,
        pricing_tier: rec.pricing_tier,
        expected_yield: rec.expected_yield_percent,
      })),
      recommended_grade: recommendations[0].grade.grade_name,
      message: `${recommendations.length} viable grades available`,
    });
  } catch (error) {
    console.error("Grade recommendations error:", error);
    return reply.status(500).send({
      error: true,
      message: "Service error",
      details: error.message,
    });
  }
}

module.exports = {
  validateCombination: validateCombination_Handler,
  getViableForSpecies: getViableForSpecies_Handler,
  getMarketCombinations: getMarketCombinations_Handler,
  getGradeRecommendations: getGradeRecommendations_Handler,
};
