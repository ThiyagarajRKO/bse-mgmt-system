"use strict";

/**
 * Grade × Size Compatibility Rule Model
 *
 * Defines allowed grade-size combinations for each species and product form.
 * Enforces market-based and processing constraints on product quality tiers.
 *
 * Examples:
 * - Small fish (0.5kg) cannot be Grade A (requires 2kg+)
 * - Shrimp >30/kg count allows all grades
 * - Crab claws <5 pieces/kg are scrap only
 */

module.exports = (sequelize, DataTypes) => {
  const GradeSizeCompatibilityRule = sequelize.define(
    "grade_size_compatibility_rule",
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      species_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: [
            [
              "Fish",
              "FlatFish",
              "Tuna",
              "Shrimp",
              "Crab",
              "Lobster",
              "Cephalopod",
              "Octopus",
              "Bivalve",
              "Gastropod",
            ],
          ],
        },
      },
      product_form: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: [
            [
              "WHOLE",
              "FILLET",
              "LOIN",
              "SAKU_BLOCK",
              "WING_FILLET",
              "WHOLE_LIVE",
              "MEAT_PACK",
              "TAIL_MEAT",
              "TUBES",
              "RINGS",
              "TENTACLES",
            ],
          ],
        },
      },
      min_size: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: true,
          min: 0.01,
        },
      },
      max_size: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: true,
          min: 0.01,
        },
      },
      unit: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [["kg", "g", "count/kg", "pcs/kg", "cm", "mm"]],
        },
      },
      grade_a: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      grade_b: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      grade_c: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      grade_d: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_blocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      reason: {
        type: DataTypes.TEXT,
      },
      priority: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      updated_by: {
        type: DataTypes.UUID,
      },
      deleted_by: {
        type: DataTypes.UUID,
      },
    },
    {
      tableName: "grade_size_compatibility_rule",
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  /**
   * Validate if a grade is allowed at a given size
   * @param {string} grade - 'A', 'B', 'C', or 'D'
   * @param {number} size - Size value
   * @param {string} speciesType - Species category
   * @param {string} productForm - Product form
   * @returns {Promise<{valid: boolean, reason?: string}>}
   */
  GradeSizeCompatibilityRule.validateGrade = async function (
    grade,
    size,
    speciesType,
    productForm
  ) {
    if (!["A", "B", "C", "D"].includes(grade)) {
      return { valid: false, reason: "Invalid grade code" };
    }

    const rule = await this.findOne({
      where: {
        species_type: speciesType,
        product_form: productForm,
        is_active: true,
      },
    });

    if (!rule) {
      return { valid: false, reason: "No rules defined for this combination" };
    }

    if (rule.is_blocked) {
      return { valid: false, reason: `Blocked: ${rule.reason}` };
    }

    const gradeField = `grade_${grade.toLowerCase()}`;
    const isAllowed = rule[gradeField];

    if (!isAllowed) {
      return {
        valid: false,
        reason: `Grade ${grade} not allowed for this size`,
      };
    }

    return { valid: true };
  };

  /**
   * Get all allowed grades for a size/species/form combination
   * @param {number} size
   * @param {string} speciesType
   * @param {string} productForm
   * @returns {Promise<string[]>}
   */
  GradeSizeCompatibilityRule.getAllowedGrades = async function (
    size,
    speciesType,
    productForm
  ) {
    const rule = await this.findOne({
      where: {
        species_type: speciesType,
        product_form: productForm,
        is_active: true,
      },
    });

    if (!rule || rule.is_blocked) {
      return [];
    }

    const allowed = [];
    if (rule.grade_a) allowed.push("A");
    if (rule.grade_b) allowed.push("B");
    if (rule.grade_c) allowed.push("C");
    if (rule.grade_d) allowed.push("D");

    return allowed;
  };

  /**
   * Check if a size/species/form is blocked
   * @param {number} size
   * @param {string} speciesType
   * @param {string} productForm
   * @returns {Promise<{is_blocked: boolean, reason?: string}>}
   */
  GradeSizeCompatibilityRule.checkBlockStatus = async function (
    size,
    speciesType,
    productForm
  ) {
    const rule = await this.findOne({
      where: {
        species_type: speciesType,
        product_form: productForm,
        is_active: true,
      },
    });

    if (!rule) {
      return { is_blocked: false };
    }

    return {
      is_blocked: rule.is_blocked,
      reason: rule.reason,
    };
  };

  /**
   * Get all rules for a species/form combination
   * @param {string} speciesType
   * @param {string} productForm
   * @returns {Promise<Array>}
   */
  GradeSizeCompatibilityRule.getRulesForSpeciesForm = async function (
    speciesType,
    productForm
  ) {
    return this.findAll({
      where: {
        species_type: speciesType,
        product_form: productForm,
        is_active: true,
      },
      order: [["min_size", "ASC"]],
    });
  };

  /**
   * Get size tiers with grade recommendations
   * @param {string} speciesType
   * @param {string} productForm
   * @returns {Promise<Array>}
   */
  GradeSizeCompatibilityRule.getSizeTiers = async function (
    speciesType,
    productForm
  ) {
    const rules = await this.getRulesForSpeciesForm(speciesType, productForm);

    return rules.map((rule) => {
      const grades = [];
      if (rule.grade_a) grades.push("A");
      if (rule.grade_b) grades.push("B");
      if (rule.grade_c) grades.push("C");
      if (rule.grade_d) grades.push("D");

      return {
        size_range: `${rule.min_size}-${rule.max_size} ${rule.unit}`,
        allowed_grades: grades,
        is_blocked: rule.is_blocked,
        reason: rule.reason,
        premium_grade: grades[0] || null,
      };
    });
  };

  return GradeSizeCompatibilityRule;
};
