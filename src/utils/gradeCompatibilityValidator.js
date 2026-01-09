"use strict";

/**
 * GRADE COMPATIBILITY VALIDATOR UTILITY
 *
 * Validates grade-size combinations before order/product creation.
 * Provides market-based recommendations and blocking rules.
 *
 * Usage:
 * const { validateGrade } = require('./gradeCompatibilityValidator');
 * const result = await validateGrade('A', 1.5, 'Fish', 'WHOLE');
 */

const models = require("../../models");
const { grade_size_compatibility_rule } = models;

/**
 * Validate if a grade is allowed at a given size
 * @param {string} gradeCode - 'A', 'B', 'C', 'D'
 * @param {number} size - Size value in specified unit
 * @param {string} speciesType - Species category
 * @param {string} productForm - Product form
 * @returns {Promise<{valid: boolean, allowed_grades: string[], reason: string, suggested_action: string, market_segment: string}>}
 */
async function validateGrade(gradeCode, size, speciesType, productForm) {
  try {
    // Input validation
    if (!["A", "B", "C", "D"].includes(gradeCode)) {
      return {
        valid: false,
        allowed_grades: [],
        reason: "Invalid grade code",
        suggested_action: "Use A, B, C, or D",
        market_segment: null,
      };
    }

    if (size <= 0) {
      return {
        valid: false,
        allowed_grades: [],
        reason: "Size must be positive",
        suggested_action: "Check size value",
        market_segment: null,
      };
    }

    // Find matching rule
    const rule = await grade_size_compatibility_rule.findOne({
      where: {
        species_type: speciesType,
        product_form: productForm,
        is_active: true,
      },
      raw: true,
    });

    if (!rule) {
      return {
        valid: false,
        allowed_grades: [],
        reason: `No compatibility rules found for ${speciesType} ${productForm}`,
        suggested_action: "Contact product team to define rules",
        market_segment: null,
      };
    }

    // Check if size is outside allowed range
    if (size < rule.min_size || size > rule.max_size) {
      return {
        valid: false,
        allowed_grades: [],
        reason: `Size ${size} ${rule.unit} outside allowed range (${rule.min_size}-${rule.max_size} ${rule.unit})`,
        suggested_action: `Use size range ${rule.min_size}-${rule.max_size} ${rule.unit}`,
        market_segment: null,
      };
    }

    // Check if size range is blocked
    if (rule.is_blocked) {
      return {
        valid: false,
        allowed_grades: [],
        reason: `Blocked: ${rule.reason}`,
        suggested_action: "This size range cannot be used",
        market_segment: null,
      };
    }

    // Check specific grade
    const gradeField = `grade_${gradeCode.toLowerCase()}`;
    const isAllowed = rule[gradeField];

    // Determine market segment
    let marketSegment = null;
    if (gradeCode === "A") {
      marketSegment = "Premium/Sashimi/Fine Dining";
    } else if (gradeCode === "B") {
      marketSegment = "Export/Retail";
    } else if (gradeCode === "C") {
      marketSegment = "Foodservice/Processing";
    } else if (gradeCode === "D") {
      marketSegment = "Industrial/Mince";
    }

    if (!isAllowed) {
      // Get allowed grades
      const allowedGrades = [];
      if (rule.grade_a) allowedGrades.push("A");
      if (rule.grade_b) allowedGrades.push("B");
      if (rule.grade_c) allowedGrades.push("C");
      if (rule.grade_d) allowedGrades.push("D");

      return {
        valid: false,
        allowed_grades: allowedGrades,
        reason: `Grade ${gradeCode} not allowed for this size`,
        suggested_action: `Use Grade ${allowedGrades.join(" or ")} instead`,
        market_segment: marketSegment,
      };
    }

    return {
      valid: true,
      allowed_grades: [gradeCode],
      reason: `Grade ${gradeCode} approved for ${size} ${rule.unit} ${speciesType} ${productForm}`,
      suggested_action: "Proceed with order creation",
      market_segment: marketSegment,
    };
  } catch (error) {
    console.error("Grade validation error:", error);
    return {
      valid: false,
      allowed_grades: [],
      reason: "Validation service error",
      suggested_action: "Try again or contact support",
      market_segment: null,
    };
  }
}

/**
 * Get all allowed grades for a size/species/form combination
 * @param {number} size
 * @param {string} speciesType
 * @param {string} productForm
 * @returns {Promise<{grades: string[], size_range: string, reason: string}>}
 */
async function getAllowedGrades(size, speciesType, productForm) {
  try {
    const rule = await grade_size_compatibility_rule.findOne({
      where: {
        species_type: speciesType,
        product_form: productForm,
        is_active: true,
      },
      raw: true,
    });

    if (
      !rule ||
      rule.is_blocked ||
      size < rule.min_size ||
      size > rule.max_size
    ) {
      return {
        grades: [],
        size_range: null,
        reason: rule ? rule.reason : "No rules found",
      };
    }

    const allowed = [];
    if (rule.grade_a) allowed.push("A");
    if (rule.grade_b) allowed.push("B");
    if (rule.grade_c) allowed.push("C");
    if (rule.grade_d) allowed.push("D");

    return {
      grades: allowed,
      size_range: `${rule.min_size}-${rule.max_size} ${rule.unit}`,
      reason: rule.reason,
    };
  } catch (error) {
    console.error("Get allowed grades error:", error);
    return {
      grades: [],
      size_range: null,
      reason: "Service error",
    };
  }
}

/**
 * Check if a size/species/form combination is blocked
 * @param {number} size
 * @param {string} speciesType
 * @param {string} productForm
 * @returns {Promise<{is_blocked: boolean, reason: string, size_range: string}>}
 */
async function checkBlockStatus(size, speciesType, productForm) {
  try {
    const rule = await grade_size_compatibility_rule.findOne({
      where: {
        species_type: speciesType,
        product_form: productForm,
        is_active: true,
      },
      raw: true,
    });

    if (!rule) {
      return {
        is_blocked: false,
        reason: "No rules defined",
        size_range: null,
      };
    }

    return {
      is_blocked: rule.is_blocked,
      reason: rule.reason,
      size_range: `${rule.min_size}-${rule.max_size} ${rule.unit}`,
    };
  } catch (error) {
    console.error("Block status check error:", error);
    return {
      is_blocked: false,
      reason: "Service error",
      size_range: null,
    };
  }
}

/**
 * Get all rules for a species/form combination
 * @param {string} speciesType
 * @param {string} productForm
 * @returns {Promise<Array>}
 */
async function getRulesForSpeciesForm(speciesType, productForm) {
  try {
    return await grade_size_compatibility_rule.findAll({
      where: {
        species_type: speciesType,
        product_form: productForm,
        is_active: true,
      },
      order: [["min_size", "ASC"]],
      raw: true,
    });
  } catch (error) {
    console.error("Get rules error:", error);
    return [];
  }
}

/**
 * Get size tiers with grade recommendations
 * @param {string} speciesType
 * @param {string} productForm
 * @returns {Promise<Array>}
 */
async function getSizeTiers(speciesType, productForm) {
  try {
    const rules = await getRulesForSpeciesForm(speciesType, productForm);

    return rules.map((rule) => {
      const grades = [];
      if (rule.grade_a) grades.push("A");
      if (rule.grade_b) grades.push("B");
      if (rule.grade_c) grades.push("C");
      if (rule.grade_d) grades.push("D");

      return {
        tier_name: `${rule.min_size}-${rule.max_size} ${rule.unit}`,
        size_range: {
          min: rule.min_size,
          max: rule.max_size,
          unit: rule.unit,
        },
        allowed_grades: grades,
        is_blocked: rule.is_blocked,
        premium_grade: grades[0] || null,
        market_segment:
          grades.length > 0
            ? grades[0] === "A"
              ? "Premium"
              : grades[0] === "B"
              ? "Standard Export"
              : "Processing"
            : "Unavailable",
        reason: rule.reason,
      };
    });
  } catch (error) {
    console.error("Get size tiers error:", error);
    return [];
  }
}

module.exports = {
  validateGrade,
  getAllowedGrades,
  checkBlockStatus,
  getRulesForSpeciesForm,
  getSizeTiers,
};
