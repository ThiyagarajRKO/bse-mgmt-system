/**
 * UOM Validation Middleware
 * =========================
 * Validates Unit of Measure combinations for product creation/updates
 * based on species type and derivative rules.
 */

const UOMValidationService = require('../services/uom_validation_service');

/**
 * Validate UOM for Product Creation/Update
 * POST/PUT /api/products, /api/product-master
 */
function validateProductUOM(req, res, next) {
  try {
    const {
      species_master_id,
      derivative_master_id,
      primary_uom,
      secondary_uom,
      species_type,
      derivative_code
    } = req.body;

    // Skip validation if required data is missing
    if (!species_type || !derivative_code) {
      console.log('[UOMValidation] Skipping validation - missing species_type or derivative_code');
      return next();
    }

    // Skip validation if UOM data is missing (will be validated by other middleware)
    if (!primary_uom) {
      console.log('[UOMValidation] Skipping validation - missing primary_uom');
      return next();
    }

    console.log(`[UOMValidation] Validating UOM for ${species_type} -> ${derivative_code}`);
    console.log(`[UOMValidation] Primary: ${primary_uom}, Secondary: ${secondary_uom || 'none'}`);

    // Validate UOM combination
    const validation = UOMValidationService.validateUOMCombination(
      species_type,
      derivative_code,
      primary_uom,
      secondary_uom
    );

    // Log validation results
    if (validation.warnings.length > 0) {
      console.warn('[UOMValidation] Warnings:', validation.warnings);
    }

    if (!validation.isValid) {
      console.error('[UOMValidation] Validation failed:', validation.errors);

      return res.status(400).json({
        error: 'UOM_VALIDATION_FAILED',
        message: 'Invalid Unit of Measure combination for this species and derivative',
        details: {
          species_type,
          derivative_code,
          provided: {
            primary_uom,
            secondary_uom
          },
          expected: validation.expected,
          errors: validation.errors,
          warnings: validation.warnings
        },
        suggestion: 'Please check the UOM requirements for this species type and derivative combination.'
      });
    }

    // Add validation results to request for logging/auditing
    req.uomValidation = {
      validated: true,
      species_type,
      derivative_code,
      primary_uom,
      secondary_uom,
      warnings: validation.warnings
    };

    console.log('[UOMValidation] UOM validation passed');
    next();

  } catch (error) {
    console.error('[UOMValidation] Middleware error:', error);
    return res.status(500).json({
      error: 'UOM_VALIDATION_ERROR',
      message: 'Error during UOM validation',
      details: error.message
    });
  }
}

/**
 * Validate UOM for Inventory Transactions
 * POST /api/inventory/*
 */
function validateInventoryUOM(req, res, next) {
  try {
    const {
      product_master_id,
      uom,
      secondary_uom
    } = req.body;

    // If no product_master_id, skip validation (will be handled by other middleware)
    if (!product_master_id) {
      return next();
    }

    // For inventory transactions, we need to fetch product details
    // This would require database access, so we'll add a lighter validation here
    // and rely on the product-level validation for comprehensive checks

    console.log(`[UOMValidation] Inventory transaction UOM: ${uom}, Secondary: ${secondary_uom || 'none'}`);

    // Basic UOM format validation
    const basicValidation = UOMValidationService.basicUOMValidation(uom, secondary_uom);

    if (!basicValidation.isValid) {
      return res.status(400).json({
        error: 'INVENTORY_UOM_VALIDATION_FAILED',
        message: 'Invalid UOM format for inventory transaction',
        errors: basicValidation.errors
      });
    }

    if (basicValidation.warnings.length > 0) {
      console.warn('[UOMValidation] Inventory UOM warnings:', basicValidation.warnings);
    }

    next();

  } catch (error) {
    console.error('[UOMValidation] Inventory validation error:', error);
    return res.status(500).json({
      error: 'INVENTORY_UOM_VALIDATION_ERROR',
      message: 'Error during inventory UOM validation',
      details: error.message
    });
  }
}

/**
 * Get UOM Requirements for Species/Derivative Combination
 * GET /api/uom-requirements?species_type=X&derivative_code=Y
 */
function getUOMRequirements(req, res) {
  try {
    const { species_type, derivative_code } = req.query;

    if (!species_type || !derivative_code) {
      return res.status(400).json({
        error: 'MISSING_PARAMETERS',
        message: 'species_type and derivative_code are required query parameters'
      });
    }

    const rules = UOMValidationService.getUOMRules(species_type, derivative_code);

    if (!rules) {
      return res.status(404).json({
        error: 'UOM_RULES_NOT_FOUND',
        message: `No UOM rules found for ${species_type} -> ${derivative_code}`,
        available_species: UOMValidationService.getSpeciesTypes(),
        available_derivatives: UOMValidationService.getDerivativesForSpecies(species_type)
      });
    }

    // Check if derivative is blocked
    const isBlocked = UOMValidationService.isDerivativeBlocked(species_type, derivative_code);

    res.json({
      species_type,
      derivative_code,
      is_blocked: isBlocked,
      uom_requirements: isBlocked ? null : rules,
      validation_service: 'UOMValidationService'
    });

  } catch (error) {
    console.error('[UOMValidation] Error getting UOM requirements:', error);
    res.status(500).json({
      error: 'UOM_REQUIREMENTS_ERROR',
      message: 'Error retrieving UOM requirements',
      details: error.message
    });
  }
}

module.exports = {
  validateProductUOM,
  validateInventoryUOM,
  getUOMRequirements
};