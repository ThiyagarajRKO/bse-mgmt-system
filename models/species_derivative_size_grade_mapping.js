"use strict";

/**
 * Species × Derivative × Size × Grade Mapping Model
 *
 * 4-dimensional mapping defining valid product combinations.
 * Each row = one valid combination with business rules and operational parameters.
 *
 * This model integrates with:
 * - derivative_size_matrix: Controls which sizes apply to each derivative
 * - derivative_grade_matrix: Controls which grades apply based on processing type
 * - grade_size_matrix: The validator enforcing derivative+grade+size rules
 *
 * Examples:
 * - Fish(Pomfret) + Whole + 0.5-2kg + Grade B → Export, 85% yield, -18°C
 * - Tuna + Loin + 1-10kg + Grade A → Sashimi, 75% yield, -20°C
 * - Shrimp + Whole + 15-30/kg + Grade C → Processing, 90% yield, -18°C
 *
 * Size/Grade Rules:
 * - Shrimp: Uses COUNT/KG sizing (8/12→A, 13/15→A/B, 16/20→B, 21/25→B/C, 26/30+→C)
 * - Crab: Uses weight sizing (300-500g→B, >500g→A for whole; by piece for claws)
 * - Fish whole: Uses kg sizing (1-2kg→B/C, 2-3kg→A/B, >3kg→A)
 * - Fish fillets: Uses gram sizing (all grades allowed)
 * - Squid: Uses mantle length (10-20cm→B/C, 20-30cm→A/B, >30cm→A)
 */

module.exports = (sequelize, DataTypes) => {
  const SpeciesDerivativeSizeGradeMapping = sequelize.define(
    "species_derivative_size_grade_mapping",
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      species_master_id: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: { isUUID: 4 },
      },
      derivative_master_id: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: { isUUID: 4 },
      },
      size_master_id: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: { isUUID: 4 },
      },
      grade_master_id: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: { isUUID: 4 },
      },
      is_viable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      viability_reason: {
        type: DataTypes.TEXT,
      },
      market_segment: {
        type: DataTypes.STRING(100),
        validate: {
          isIn: [
            [
              "Premium",
              "Sashimi",
              "Fine_Dining",
              "Export",
              "Retail",
              "Domestic",
              "Foodservice",
              "Processing",
              "Industrial",
            ],
          ],
        },
      },
      expected_yield_percent: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 85.0,
        validate: {
          min: 0,
          max: 100,
        },
      },
      processing_difficulty: {
        type: DataTypes.ENUM("Easy", "Medium", "Hard", "Very_Hard"),
        defaultValue: "Medium",
      },
      storage_temperature_celsius: {
        type: DataTypes.INTEGER,
        validate: {
          min: -40,
          max: 25,
        },
      },
      shelf_life_days: {
        type: DataTypes.INTEGER,
        validate: {
          min: 1,
          max: 730,
        },
      },
      recommended_supplier_types: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      certification_requirements: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      packaging_type_preferred: {
        type: DataTypes.STRING(100),
      },
      pricing_tier: {
        type: DataTypes.ENUM("Premium", "Standard", "Value", "Economy"),
        defaultValue: "Standard",
      },
      weight_loss_percent_thaw: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 3.0,
        validate: {
          min: 0,
          max: 50,
        },
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
      tableName: "species_derivative_size_grade_mapping",
      timestamps: true,
      paranoid: true,
      underscored: true,
    },
  );

  // Associations
  SpeciesDerivativeSizeGradeMapping.associate = function (models) {
    if (models.SpeciesMaster) {
      SpeciesDerivativeSizeGradeMapping.belongsTo(models.SpeciesMaster, {
        foreignKey: "species_master_id",
        as: "species",
      });
    }
    if (models.DerivativeMaster) {
      SpeciesDerivativeSizeGradeMapping.belongsTo(models.DerivativeMaster, {
        foreignKey: "derivative_master_id",
        as: "derivative",
      });
    }
    if (models.SizeMaster) {
      SpeciesDerivativeSizeGradeMapping.belongsTo(models.SizeMaster, {
        foreignKey: "size_master_id",
        as: "size",
      });
    }
    if (models.GradeMaster) {
      SpeciesDerivativeSizeGradeMapping.belongsTo(models.GradeMaster, {
        foreignKey: "grade_master_id",
        as: "grade",
      });
    }
    if (models.UserProfiles) {
      SpeciesDerivativeSizeGradeMapping.belongsTo(models.UserProfiles, {
        foreignKey: "created_by",
        as: "creator",
      });
    }

    // Associations with matrix tables
    if (models.DerivativeSizeMatrix) {
      SpeciesDerivativeSizeGradeMapping.hasMany(models.DerivativeSizeMatrix, {
        foreignKey: "derivative_id",
        sourceKey: "derivative_master_id",
        as: "derivativeSizeMappings",
      });
    }
    if (models.DerivativeGradeMatrix) {
      SpeciesDerivativeSizeGradeMapping.hasMany(models.DerivativeGradeMatrix, {
        foreignKey: "derivative_id",
        sourceKey: "derivative_master_id",
        as: "derivativeGradeMappings",
      });
    }
    if (models.GradeSizeMatrix) {
      SpeciesDerivativeSizeGradeMapping.hasMany(models.GradeSizeMatrix, {
        foreignKey: "derivative_id",
        sourceKey: "derivative_master_id",
        as: "gradeSizeValidations",
      });
    }
  };

  /**
   * Find viable combinations for a species
   * @param {UUID} speciesId
   * @returns {Promise<Array>}
   */
  SpeciesDerivativeSizeGradeMapping.findViableForSpecies = async function (
    speciesId,
  ) {
    return this.findAll({
      where: {
        species_master_id: speciesId,
        is_viable: true,
        is_active: true,
      },
      include: [
        { association: "derivative", attributes: ["id", "derivative_name"] },
        { association: "size", attributes: ["id", "size_name"] },
        {
          association: "grade",
          attributes: ["id", "grade_code", "grade_name"],
        },
      ],
      order: [["market_segment", "ASC"]],
    });
  };

  /**
   * Find combinations for derivative with all grades
   * @param {UUID} derivativeId
   * @returns {Promise<Array>}
   */
  SpeciesDerivativeSizeGradeMapping.findByDerivative = async function (
    derivativeId,
  ) {
    return this.findAll({
      where: {
        derivative_master_id: derivativeId,
        is_viable: true,
        is_active: true,
      },
      include: [
        { association: "species", attributes: ["id", "species_name"] },
        { association: "size", attributes: ["id", "size_name"] },
        { association: "grade", attributes: ["id", "grade_code"] },
      ],
    });
  };

  /**
   * Get all valid combinations matching species, derivative, size, grade
   * @param {UUID} speciesId
   * @param {UUID} derivativeId
   * @param {UUID} sizeId
   * @param {UUID} gradeId
   * @returns {Promise<Object|null>}
   */
  SpeciesDerivativeSizeGradeMapping.findCombination = async function (
    speciesId,
    derivativeId,
    sizeId,
    gradeId,
  ) {
    return this.findOne({
      where: {
        species_master_id: speciesId,
        derivative_master_id: derivativeId,
        size_master_id: sizeId,
        grade_master_id: gradeId,
        is_viable: true,
        is_active: true,
      },
      include: [
        { association: "species" },
        { association: "derivative" },
        { association: "size" },
        { association: "grade" },
      ],
    });
  };

  /**
   * Get market recommendations for a combination
   * @param {UUID} speciesId
   * @param {UUID} derivativeId
   * @param {UUID} sizeId
   * @returns {Promise<Array>}
   */
  SpeciesDerivativeSizeGradeMapping.getMarketRecommendations = async function (
    speciesId,
    derivativeId,
    sizeId,
  ) {
    return this.findAll({
      where: {
        species_master_id: speciesId,
        derivative_master_id: derivativeId,
        size_master_id: sizeId,
        is_viable: true,
        is_active: true,
      },
      attributes: [
        "market_segment",
        "pricing_tier",
        "processing_difficulty",
        "expected_yield_percent",
      ],
      include: [
        {
          association: "grade",
          attributes: ["id", "grade_code", "grade_name"],
        },
      ],
      order: [["pricing_tier", "ASC"]],
    });
  };

  /**
   * Get all combinations for a market segment
   * @param {string} marketSegment - Premium, Export, Processing, etc.
   * @returns {Promise<Array>}
   */
  SpeciesDerivativeSizeGradeMapping.findByMarket = async function (
    marketSegment,
  ) {
    return this.findAll({
      where: {
        market_segment: marketSegment,
        is_viable: true,
        is_active: true,
      },
      include: [
        { association: "species", attributes: ["id", "species_name"] },
        { association: "derivative", attributes: ["id", "derivative_name"] },
        { association: "size", attributes: ["id", "size_name"] },
        { association: "grade", attributes: ["id", "grade_code"] },
      ],
    });
  };

  /**
   * Calculate product cost with yield and weight loss
   * @param {number} rawCost - Cost of raw material
   * @param {Object} mapping - This mapping record
   * @returns {number}
   */
  SpeciesDerivativeSizeGradeMapping.calculateProcessedCost = function (
    rawCost,
    mapping,
  ) {
    const yieldFactor = mapping.expected_yield_percent / 100;
    const thawLossFactor = (100 - mapping.weight_loss_percent_thaw) / 100;
    return rawCost / (yieldFactor * thawLossFactor);
  };

  /**
   * Validate combination against derivative-size-grade matrix rules
   * @param {UUID} derivativeId
   * @param {UUID} sizeId
   * @param {UUID} gradeId
   * @returns {Promise<Object>} { isValid: boolean, message: string, errors: string[] }
   */
  SpeciesDerivativeSizeGradeMapping.validateAgainstMatrix = async function (
    derivativeId,
    sizeId,
    gradeId,
  ) {
    const errors = [];
    let isValid = true;

    try {
      // Check if size is allowed for derivative
      const sizeAllowed = await sequelize.models.DerivativeSizeMatrix.findOne({
        where: {
          derivative_id: derivativeId,
          size_id: sizeId,
          is_allowed: true,
          is_active: true,
        },
      });

      if (!sizeAllowed) {
        errors.push("Size is not allowed for this derivative");
        isValid = false;
      }

      // Check if grade is allowed for derivative (via grade_size_matrix)
      const gradeAllowed = await sequelize.models.GradeSizeMatrix.findOne({
        where: {
          derivative_id: derivativeId,
          grade_id: gradeId,
          size_id: sizeId,
          is_allowed: true,
          is_active: true,
        },
      });

      if (!gradeAllowed) {
        errors.push(
          "Grade is not allowed for this derivative+size combination",
        );
        isValid = false;
      }
    } catch (err) {
      console.error("Error validating against matrix:", err);
      errors.push(`Validation error: ${err.message}`);
      isValid = false;
    }

    return {
      isValid,
      message: isValid
        ? "Combination is valid"
        : `Combination has ${errors.length} error(s)`,
      errors,
    };
  };

  /**
   * Get size type for a derivative
   * @param {UUID} derivativeId
   * @returns {Promise<string|null>} Size type (FISH_WT_KG, SHRIMP_COUNT_PER_KG, etc.)
   */
  SpeciesDerivativeSizeGradeMapping.getSizeTypeForDerivative = async function (
    derivativeId,
  ) {
    const derivative = await sequelize.models.DerivativeMaster.findByPk(
      derivativeId,
      {
        attributes: ["derivative_code"],
      },
    );

    if (!derivative) return null;

    // Use config matrix to get size type
    const matrix = require("../config/derivative-size-grade-matrix");
    return matrix.getSizeTypeForDerivative(derivative.derivative_code);
  };

  /**
   * Check if derivative uses pack size instead of size master
   * @param {UUID} derivativeId
   * @returns {Promise<boolean>}
   */
  SpeciesDerivativeSizeGradeMapping.usePackSizeInstead = async function (
    derivativeId,
  ) {
    const derivative = await sequelize.models.DerivativeMaster.findByPk(
      derivativeId,
      {
        attributes: ["derivative_code"],
      },
    );

    if (!derivative) return false;

    const matrix = require("../config/derivative-size-grade-matrix");
    return matrix.usesPackSizeInstead(derivative.derivative_code);
  };

  /**
   * Get all valid grades for a size+derivative combination
   * @param {UUID} derivativeId
   * @param {UUID} sizeId
   * @returns {Promise<Array>}
   */
  SpeciesDerivativeSizeGradeMapping.getValidGradesForSizeDerivative =
    async function (derivativeId, sizeId) {
      return sequelize.models.GradeSizeMatrix.findAll({
        where: {
          derivative_id: derivativeId,
          size_id: sizeId,
          is_allowed: true,
          is_active: true,
        },
        attributes: [],
        include: [
          {
            model: sequelize.models.GradeMaster,
            as: "grade",
            attributes: ["id", "grade_code", "grade_name"],
            required: true,
          },
        ],
        raw: false,
        subQuery: false,
      });
    };

  /**
   * Get all valid sizes for a derivative+grade combination
   * @param {UUID} derivativeId
   * @param {UUID} gradeId
   * @returns {Promise<Array>}
   */
  SpeciesDerivativeSizeGradeMapping.getValidSizesForGradeDerivative =
    async function (derivativeId, gradeId) {
      return sequelize.models.GradeSizeMatrix.findAll({
        where: {
          derivative_id: derivativeId,
          grade_id: gradeId,
          is_allowed: true,
          is_active: true,
        },
        attributes: [],
        include: [
          {
            model: sequelize.models.SizeMaster,
            as: "size",
            attributes: ["id", "size", "size_type", "unit_of_measure"],
            required: true,
          },
        ],
        raw: false,
        subQuery: false,
      });
    };

  /**
   * Validate and create new mapping with matrix checks
   * @param {Object} data - { species_master_id, derivative_master_id, size_master_id, grade_master_id, ... }
   * @param {Object} options - Sequelize options
   * @returns {Promise<Object>}
   */
  SpeciesDerivativeSizeGradeMapping.createWithValidation = async function (
    data,
    options = {},
  ) {
    // Validate against matrix first
    const validation = await this.validateAgainstMatrix(
      data.derivative_master_id,
      data.size_master_id,
      data.grade_master_id,
    );

    if (!validation.isValid) {
      const error = new Error(
        `Invalid combination: ${validation.errors.join("; ")}`,
      );
      error.validationErrors = validation.errors;
      throw error;
    }

    // Create the mapping
    return this.create(data, options);
  };

  return SpeciesDerivativeSizeGradeMapping;
};
