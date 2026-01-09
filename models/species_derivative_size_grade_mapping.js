"use strict";

/**
 * Species × Derivative × Size × Grade Mapping Model
 *
 * 4-dimensional mapping defining valid product combinations.
 * Each row = one valid combination with business rules and operational parameters.
 *
 * Examples:
 * - Fish(Pomfret) + Whole + 0.5-2kg + Grade B → Export, 85% yield, -18°C
 * - Tuna + Loin + 1-10kg + Grade A → Sashimi, 75% yield, -20°C
 * - Shrimp + Whole + 15-30/kg + Grade C → Processing, 90% yield, -18°C
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
    }
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
  };

  /**
   * Find viable combinations for a species
   * @param {UUID} speciesId
   * @returns {Promise<Array>}
   */
  SpeciesDerivativeSizeGradeMapping.findViableForSpecies = async function (
    speciesId
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
    derivativeId
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
    gradeId
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
    sizeId
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
    marketSegment
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
    mapping
  ) {
    const yieldFactor = mapping.expected_yield_percent / 100;
    const thawLossFactor = (100 - mapping.weight_loss_percent_thaw) / 100;
    return rawCost / (yieldFactor * thawLossFactor);
  };

  return SpeciesDerivativeSizeGradeMapping;
};
