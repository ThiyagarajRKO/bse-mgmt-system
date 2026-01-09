"use strict";

/**
 * API HANDLER: Validate Grade × Size Compatibility
 *
 * Endpoint: POST /product-master/validate-grade-size
 *
 * Request:
 * {
 *   "grade": "A",
 *   "size": 1.5,
 *   "species_type": "Fish",
 *   "product_form": "WHOLE"
 * }
 *
 * Response:
 * {
 *   "valid": true,
 *   "grade": "A",
 *   "allowed_grades": ["A", "B", "C"],
 *   "reason": "Grade A approved...",
 *   "market_segment": "Premium/Sashimi",
 *   "suggested_action": "Proceed with order creation",
 *   "size_range": "0.5-2.0 kg"
 * }
 */

const {
  validateGrade,
  getAllowedGrades,
  getSizeTiers,
} = require("../../utils/gradeCompatibilityValidator");

async function validateGradeSize(request, reply) {
  try {
    const { grade, size, species_type, product_form } = request.body;

    // Input validation
    if (!grade || !["A", "B", "C", "D"].includes(grade.toUpperCase())) {
      return reply.status(400).send({
        error: true,
        message: "Invalid grade. Use A, B, C, or D",
      });
    }

    if (!size || typeof size !== "number" || size <= 0) {
      return reply.status(400).send({
        error: true,
        message: "Invalid size. Must be a positive number",
      });
    }

    if (!species_type) {
      return reply.status(400).send({
        error: true,
        message:
          "Species type required: Fish, FlatFish, Tuna, Shrimp, Crab, Lobster, Cephalopod, Octopus, Bivalve, Gastropod",
      });
    }

    if (!product_form) {
      return reply.status(400).send({
        error: true,
        message:
          "Product form required: WHOLE, FILLET, LOIN, SAKU_BLOCK, WHOLE_LIVE, MEAT_PACK, TAIL_MEAT, TUBES, RINGS, TENTACLES",
      });
    }

    // Validate grade
    const validation = await validateGrade(
      grade.toUpperCase(),
      size,
      species_type,
      product_form
    );

    // Get all allowed grades for this size
    const allowedGrades = await getAllowedGrades(
      size,
      species_type,
      product_form
    );

    // Get size tiers for context
    const sizeTiers = await getSizeTiers(species_type, product_form);
    const currentTier = sizeTiers.find(
      (tier) => size >= tier.size_range.min && size <= tier.size_range.max
    );

    return reply.status(200).send({
      valid: validation.valid,
      grade: grade.toUpperCase(),
      size: size,
      species_type: species_type,
      product_form: product_form,
      allowed_grades: validation.allowed_grades,
      all_available_grades: allowedGrades.grades,
      reason: validation.reason,
      market_segment: validation.market_segment,
      suggested_action: validation.suggested_action,
      size_range: currentTier
        ? `${currentTier.size_range.min}-${currentTier.size_range.max} ${currentTier.size_range.unit}`
        : null,
      size_tier_info: currentTier
        ? {
            tier_name: currentTier.tier_name,
            is_blocked: currentTier.is_blocked,
            premium_grade: currentTier.premium_grade,
            reason: currentTier.reason,
          }
        : null,
      available_tiers: sizeTiers,
    });
  } catch (error) {
    console.error("Grade size validation error:", error);
    return reply.status(500).send({
      error: true,
      message: "Validation service error",
      details: error.message,
    });
  }
}

module.exports = { validateGradeSize };
