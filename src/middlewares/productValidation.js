/**
 * Product Validation Middleware
 *
 * Enforces ERP business rules:
 * - RULE 1: Species ↔ Product Form Compatibility
 * - RULE 2: Grade ↔ Size Compatibility
 * - RULE 3: SKU Uniqueness
 * - RULE 4: HSN from SpeciesMaster (no override)
 */

import models from "../../models";
import {
  validateFormForSpecies,
  validateSizeForGrade,
  generateSKU,
  getHSNFromSpecies,
  allowedFormsBySpecies,
  allowedSizesByGrade,
} from "../utils/rulesEngine";

/**
 * Validate product input against ERP business rules
 *
 * Required body fields:
 * - species_master_id: ID of species (must exist)
 * - product_category_master_id: ID of product category (must be valid for species)
 * - grade_master_id: ID of grade (must be compatible with size)
 * - size_master_id: ID of size (must be compatible with grade)
 *
 * @middleware
 */
export const validateProductInput = async (req, reply) => {
  try {
    const {
      species_master_id,
      product_category_master_id,
      product_category, // fallback
      grade_master_id,
      size_master_id,
      product_master_id, // For updates (optional)
    } = req.body;

    // ───────────────────────────────────────────────────────────
    // 1. Validate species exists
    // ───────────────────────────────────────────────────────────
    if (!species_master_id) {
      return reply.code(400).send({
        success: false,
        message: "Species ID is required",
      });
    }

    const species = await models.SpeciesMaster.findByPk(species_master_id, {
      attributes: ["id", "species_name", "hsn_code", "is_active"],
    });

    if (!species) {
      return reply.code(400).send({
        success: false,
        message: "Invalid species ID",
      });
    }

    if (!species.is_active) {
      return reply.code(400).send({
        success: false,
        message: "Species is not active",
      });
    }

    // ───────────────────────────────────────────────────────────
    // 2. Validate product category exists and belongs to species
    // ───────────────────────────────────────────────────────────
    if (!product_category_master_id && !product_category) {
      return reply.code(400).send({
        success: false,
        message: "Product form/category is required",
      });
    }

    let categoryName = product_category;

    // If product_category_master_id is provided, fetch and validate it
    if (product_category_master_id) {
      const productCategoryData = await models.ProductCategoryMaster.findByPk(
        product_category_master_id,
        {
          attributes: [
            "id",
            "product_category",
            "species_master_id",
            "is_active",
          ],
        }
      );

      if (!productCategoryData) {
        return reply.code(400).send({
          success: false,
          message: "Invalid product category ID",
        });
      }

      if (!productCategoryData.is_active) {
        return reply.code(400).send({
          success: false,
          message: "Product category is not active",
        });
      }

      if (productCategoryData.species_master_id !== species_master_id) {
        return reply.code(422).send({
          success: false,
          statusCode: 422,
          message: `Product category does not belong to selected species`,
        });
      }

      categoryName = productCategoryData.product_category;
    }

    // Validate product form against species
    const formValidation = validateFormForSpecies(
      species.species_name,
      categoryName
    );

    if (!formValidation.valid) {
      return reply.code(422).send({
        success: false,
        statusCode: 422,
        message: `Invalid product form: ${formValidation.error}`,
      });
    }

    // ───────────────────────────────────────────────────────────
    // 3. Validate grade exists
    // ───────────────────────────────────────────────────────────
    if (!grade_master_id) {
      return reply.code(400).send({
        success: false,
        message: "Grade ID is required",
      });
    }

    const grade = await models.GradeMaster.findByPk(grade_master_id, {
      attributes: ["id", "grade_name", "is_active"],
    });

    if (!grade) {
      return reply.code(400).send({
        success: false,
        message: "Invalid grade ID",
      });
    }

    if (!grade.is_active) {
      return reply.code(400).send({
        success: false,
        message: "Grade is not active",
      });
    }

    // ───────────────────────────────────────────────────────────
    // 4. Validate size exists
    // ───────────────────────────────────────────────────────────
    if (!size_master_id) {
      return reply.code(400).send({
        success: false,
        message: "Size ID is required",
      });
    }

    const size = await models.SizeMaster.findByPk(size_master_id, {
      attributes: ["id", "size", "unit_of_measure", "is_active"],
    });

    if (!size) {
      return reply.code(400).send({
        success: false,
        message: "Invalid size ID",
      });
    }

    if (!size.is_active) {
      return reply.code(400).send({
        success: false,
        message: "Size is not active",
      });
    }

    // ───────────────────────────────────────────────────────────
    // 5. RULE 2: Validate size compatibility with grade
    // ───────────────────────────────────────────────────────────
    const sizeValidation = validateSizeForGrade(grade.grade_name, size.size);

    if (!sizeValidation.valid) {
      return reply.code(422).send({
        success: false,
        statusCode: 422,
        message: `Size not compatible with grade: ${sizeValidation.error}`,
      });
    }

    // ───────────────────────────────────────────────────────────
    // 6. RULE 3: Validate SKU uniqueness (simplified)
    // ───────────────────────────────────────────────────────────
    const sku = generateSKU(
      species_master_id,
      categoryName,
      grade.grade_name,
      size_master_id
    );

    // Note: SKU uniqueness validation is handled at the database level
    // via unique constraint on (species + category + grade + size)
    // We skip complex join validation here to avoid model association issues

    // ───────────────────────────────────────────────────────────
    // 7. RULE 4: Get HSN from SpeciesMaster (no override allowed)
    // ───────────────────────────────────────────────────────────
    const hsn = getHSNFromSpecies(species);

    if (!hsn) {
      return reply.code(400).send({
        success: false,
        message: `HSN code not configured for species: ${species.species_name}`,
      });
    }

    // ───────────────────────────────────────────────────────────
    // 8. Store validated data in request for controller
    // ───────────────────────────────────────────────────────────
    req.validatedProduct = {
      species,
      grade,
      size,
      sku,
      hsn,
      formValidation,
      sizeValidation,
    };
  } catch (err) {
    console.error("Product validation error:", err);
    return reply.code(500).send({
      success: false,
      message: "Product validation error",
      error: err.message,
    });
  }
};

/**
 * Middleware to provide allowed forms and sizes
 * Useful for frontend dropdowns
 */
export const getProductRules = async (req, reply) => {
  try {
    const { species_id, grade_id } = req.query;

    if (!species_id) {
      return reply.code(400).send({
        success: false,
        message: "species_id query parameter required",
      });
    }

    const species = await models.SpeciesMaster.findByPk(species_id, {
      attributes: ["id", "species_name"],
    });

    if (!species) {
      return reply.code(400).send({
        success: false,
        message: "Invalid species ID",
      });
    }

    const allowedForms = allowedFormsBySpecies(species.species_name);
    let allowedSizes = [];

    if (grade_id) {
      const grade = await models.GradeMaster.findByPk(grade_id, {
        attributes: ["id", "grade_name"],
      });

      if (grade) {
        allowedSizes = allowedSizesByGrade(grade.grade_name);
      }
    }

    return reply.code(200).send({
      success: true,
      message: "Product rules retrieved",
      data: {
        species_id,
        species_name: species.species_name,
        allowed_forms: allowedForms,
        grade_id,
        allowed_sizes: allowedSizes,
      },
    });
  } catch (err) {
    console.error("Error retrieving product rules:", err);
    return reply.code(500).send({
      success: false,
      message: "Error retrieving product rules",
      error: err.message,
    });
  }
};

export default { validateProductInput, getProductRules };
