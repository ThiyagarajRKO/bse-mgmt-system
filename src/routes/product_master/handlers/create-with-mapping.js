/**
 * Product Creation Handler with 4D Mapping Validation
 *
 * Ensures all new products follow the validated 4D combinations:
 * Species × Derivative × Size × Grade
 *
 * Features:
 * - Validates combination exists in mapping table
 * - Auto-assigns market segment, yield, shelf life, storage temp
 * - Prevents invalid combinations
 * - Generates meaningful product codes
 */

const { Op } = require("sequelize");
const db = require("../../../../models");

const handlers = {
  /**
   * Create product with 4D mapping validation
   *
   * POST /api/product-master/create-with-mapping
   *
   * Body:
   * {
   *   "species_master_id": "uuid",
   *   "derivative_master_id": "uuid",
   *   "size_master_id": "uuid",
   *   "grade_master_id": "uuid",
   *   "product_category_master_id": "uuid"
   * }
   */
  async createWithMapping(req, res) {
    try {
      const {
        species_master_id,
        derivative_master_id,
        size_master_id,
        grade_master_id,
        product_category_master_id,
      } = req.body;

      // Validate all required fields
      if (
        !species_master_id ||
        !derivative_master_id ||
        !size_master_id ||
        !grade_master_id
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: species_master_id, derivative_master_id, size_master_id, grade_master_id",
          code: "INVALID_FIELDS",
        });
      }

      // Find valid 4D mapping
      const mapping = await db.SpeciesDerivativeSizeGradeMapping.findOne({
        where: {
          species_master_id,
          derivative_master_id,
          size_master_id,
          grade_master_id,
          is_active: true,
        },
        include: [
          {
            model: db.SpeciesMaster,
            attributes: ["species_name", "species_code"],
            as: "SpeciesMaster",
          },
          {
            model: db.DerivativeMaster,
            attributes: ["derivative_code", "derivative_name"],
            as: "DerivativeMaster",
          },
          {
            model: db.SizeMaster,
            attributes: ["size"],
            as: "SizeMaster",
          },
          {
            model: db.GradeMaster,
            attributes: ["grade_code", "grade_name"],
            as: "GradeMaster",
          },
        ],
      });

      if (!mapping) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid combination: This species × derivative × size × grade combination is not valid or not viable",
          code: "INVALID_COMBINATION",
          details: {
            species_id: species_master_id,
            derivative_id: derivative_master_id,
            size_id: size_master_id,
            grade_id: grade_master_id,
          },
        });
      }

      // Check if product already exists with same mapping
      const existingProduct = await db.ProductMaster.findOne({
        where: {
          species_derivative_size_grade_mapping_id: mapping.id,
          is_active: true,
        },
      });

      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: "Product already exists for this 4D combination",
          code: "DUPLICATE_PRODUCT",
          product_id: existingProduct.id,
          product_name: existingProduct.product_name,
        });
      }

      // Create product with mapping
      const product = await db.ProductMaster.create(
        {
          species_derivative_size_grade_mapping_id: mapping.id,
          species_master_id: mapping.species_master_id,
          derivative_master_id: mapping.derivative_master_id,
          size_master_id: mapping.size_master_id,
          grade_master_id: mapping.grade_master_id,
          product_category_master_id,
          is_active: true,
          created_by: req.user?.id || req.profile_id,
        },
        { profile_id: req.user?.id || req.profile_id }
      );

      return res.status(201).json({
        success: true,
        message: "Product created successfully with 4D mapping validation",
        code: "PRODUCT_CREATED",
        product: {
          id: product.id,
          product_name: product.product_name,
          species_name: mapping.SpeciesMaster.species_name,
          derivative: mapping.DerivativeMaster.derivative_code,
          size: mapping.SizeMaster.size,
          grade: mapping.GradeMaster.grade_code,
          market_segment: mapping.market_segment,
          expected_yield: `${mapping.expected_yield_percent}%`,
          shelf_life_days: mapping.shelf_life_days,
          storage_temp_celsius: mapping.storage_temperature_celsius,
          packaging: mapping.packaging_type_preferred,
          pricing_tier: mapping.pricing_tier,
        },
      });
    } catch (error) {
      console.error("Error creating product with mapping:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to create product",
        error: error.message,
        code: "PRODUCT_CREATION_ERROR",
      });
    }
  },

  /**
   * Get suggested products for species × derivative
   *
   * GET /api/product-master/suggestions?species_id=uuid&derivative_id=uuid
   *
   * Returns available sizes and grades for the given species/derivative
   */
  async getSuggestions(req, res) {
    try {
      const { species_id, derivative_id } = req.query;

      if (!species_id || !derivative_id) {
        return res.status(400).json({
          success: false,
          message: "Missing required query params: species_id, derivative_id",
          code: "MISSING_PARAMS",
        });
      }

      const mappings = await db.SpeciesDerivativeSizeGradeMapping.findAll({
        where: {
          species_master_id: species_id,
          derivative_master_id: derivative_id,
          is_active: true,
        },
        attributes: [
          "size_master_id",
          "grade_master_id",
          "market_segment",
          "pricing_tier",
        ],
        include: [
          {
            model: db.SizeMaster,
            attributes: ["id", "size", "unit_of_measure"],
            as: "SizeMaster",
          },
          {
            model: db.GradeMaster,
            attributes: ["id", "grade_code", "grade_name"],
            as: "GradeMaster",
          },
        ],
        raw: false,
      });

      if (mappings.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No valid combinations found for this species/derivative",
          code: "NO_COMBINATIONS",
        });
      }

      // Group by grade
      const byGrade = {};
      mappings.forEach((m) => {
        const grade = m.GradeMaster.grade_code;
        if (!byGrade[grade]) {
          byGrade[grade] = [];
        }
        byGrade[grade].push({
          size_id: m.SizeMaster.id,
          size: m.SizeMaster.size,
          unit: m.SizeMaster.unit_of_measure,
          market_segment: m.market_segment,
          pricing_tier: m.pricing_tier,
        });
      });

      return res.status(200).json({
        success: true,
        message: "Product suggestions retrieved",
        code: "SUGGESTIONS_FOUND",
        suggestions: byGrade,
        total_combinations: mappings.length,
      });
    } catch (error) {
      console.error("Error getting suggestions:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to get suggestions",
        error: error.message,
        code: "SUGGESTION_ERROR",
      });
    }
  },

  /**
   * Validate a proposed product combination
   *
   * POST /api/product-master/validate-combination
   *
   * Body:
   * {
   *   "species_master_id": "uuid",
   *   "derivative_master_id": "uuid",
   *   "size_master_id": "uuid",
   *   "grade_master_id": "uuid"
   * }
   */
  async validateCombination(req, res) {
    try {
      const {
        species_master_id,
        derivative_master_id,
        size_master_id,
        grade_master_id,
      } = req.body;

      if (
        !species_master_id ||
        !derivative_master_id ||
        !size_master_id ||
        !grade_master_id
      ) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
          code: "MISSING_FIELDS",
        });
      }

      const mapping = await db.SpeciesDerivativeSizeGradeMapping.findOne({
        where: {
          species_master_id,
          derivative_master_id,
          size_master_id,
          grade_master_id,
          is_active: true,
        },
        include: [
          {
            model: db.SpeciesMaster,
            attributes: ["species_name"],
          },
          {
            model: db.DerivativeMaster,
            attributes: ["derivative_code", "derivative_name"],
          },
          {
            model: db.SizeMaster,
            attributes: ["size"],
          },
          {
            model: db.GradeMaster,
            attributes: ["grade_code", "grade_name"],
          },
        ],
      });

      if (!mapping) {
        return res.status(200).json({
          success: false,
          valid: false,
          message: "This combination is not valid",
          code: "INVALID_COMBINATION",
        });
      }

      return res.status(200).json({
        success: true,
        valid: true,
        message: "Combination is valid",
        code: "VALID_COMBINATION",
        details: {
          market_segment: mapping.market_segment,
          expected_yield: `${mapping.expected_yield_percent}%`,
          shelf_life_days: mapping.shelf_life_days,
          storage_temp: mapping.storage_temperature_celsius,
          pricing_tier: mapping.pricing_tier,
          processing_difficulty: mapping.processing_difficulty,
        },
      });
    } catch (error) {
      console.error("Error validating combination:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to validate combination",
        error: error.message,
        code: "VALIDATION_ERROR",
      });
    }
  },
};

module.exports = handlers;
module.exports.createWithMapping = handlers.createWithMapping;
module.exports.getSuggestions = handlers.getSuggestions;
module.exports.validateCombination = handlers.validateCombination;
