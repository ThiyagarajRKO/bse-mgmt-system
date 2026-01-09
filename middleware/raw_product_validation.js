/**
 * RAW Product Transaction Middleware
 * ====================================
 * Blocks UNSIZED raw products from entering production or sales.
 * Applied at API route level.
 */

/**
 * Block UNSIZED in Production Issue
 * POST /api/production/issue
 */
function blockUnsizedInProduction(req, res, next) {
  const { productId, sizeCode } = req.body;

  // Check if UNSIZED is in payload
  if (sizeCode === "UNSIZED" || sizeCode?.includes("UNSIZED")) {
    return res.status(400).json({
      error: "UNSIZED_NOT_ALLOWED_PRODUCTION",
      message:
        "UNSIZED raw material cannot be issued to production. Must be sorted and assigned a specific size first.",
      hint: "Use intake→sorting→sizing workflow to bucket UNSIZED material.",
      productId,
    });
  }

  next();
}

/**
 * Block UNSIZED in Sales Order
 * POST /api/sales/order-line
 */
function blockUnsizedInSales(req, res, next) {
  const { productId, sizeCode } = req.body;

  if (sizeCode === "UNSIZED" || sizeCode?.includes("UNSIZED")) {
    return res.status(400).json({
      error: "UNSIZED_NOT_ALLOWED_SALES",
      message:
        "UNSIZED raw material cannot be sold. Must be sorted and assigned a specific size first.",
      hint: "Complete intake→sizing before creating sales orders.",
      productId,
    });
  }

  next();
}

/**
 * Validate RAW product is not marked as producible
 * Used in product creation/update endpoints
 */
function validateRawNotProducible(req, res, next) {
  const { processing_state, is_producible } = req.body;

  if (processing_state === "RAW" && is_producible === true) {
    return res.status(400).json({
      error: "RAW_CANNOT_BE_PRODUCIBLE",
      message:
        "RAW products are consumed in production, not produced. is_producible must be FALSE.",
      hint: "RAW materials flow: Intake → Inventory → Production Issue → WIP",
    });
  }

  next();
}

/**
 * Validate RAW product has no grade
 */
function validateRawNoGrade(req, res, next) {
  const { processing_state, grade_master_id } = req.body;

  if (
    processing_state === "RAW" &&
    grade_master_id !== null &&
    grade_master_id !== undefined
  ) {
    return res.status(400).json({
      error: "RAW_CANNOT_HAVE_GRADE",
      message:
        "RAW products have no quality grade. Grades apply only to processed derivatives.",
      hint: "Grade is assigned post-processing (e.g., Fillet Grade A)",
      gradeId: grade_master_id,
    });
  }

  next();
}

/**
 * Validate RAW product has size
 */
function validateRawHasSize(req, res, next) {
  const { processing_state, size_master_id } = req.body;

  if (processing_state === "RAW" && !size_master_id) {
    return res.status(400).json({
      error: "RAW_SIZE_REQUIRED",
      message:
        "RAW products must have a size (including UNSIZED bucket for intake).",
      hint: "Size can be UNSIZED for mixed/unsorted catch; will be sorted later.",
    });
  }

  next();
}

/**
 * Enforce PROCESSED products must have derivative
 */
function validateProcessedHasDerivative(req, res, next) {
  const { processing_state, derivative_master_id } = req.body;

  if (processing_state === "PROCESSED" && !derivative_master_id) {
    return res.status(400).json({
      error: "PROCESSED_NEEDS_DERIVATIVE",
      message:
        "PROCESSED products must reference a derivative (Fillet, Loin, Tube, etc.)",
      hint: "RAW → Derivative is a mandatory transformation step.",
    });
  }

  next();
}

/**
 * Combined RAW product validator (all checks)
 */
function validateRawProduct(req, res, next) {
  const validations = [
    { check: validateRawNotProducible, name: "validateRawNotProducible" },
    { check: validateRawNoGrade, name: "validateRawNoGrade" },
    { check: validateRawHasSize, name: "validateRawHasSize" },
    {
      check: validateProcessedHasDerivative,
      name: "validateProcessedHasDerivative",
    },
  ];

  // Run all validations
  for (const { check } of validations) {
    try {
      // Create a mock next that collects errors
      let hasError = false;
      check(
        req,
        {
          status: (code) => ({
            json: (err) => {
              hasError = true;
              return res.status(code).json(err);
            },
          }),
        },
        () => {}
      );

      if (hasError) {
        return; // Error response already sent
      }
    } catch (err) {
      return res.status(500).json({
        error: "VALIDATION_ERROR",
        message: err.message,
      });
    }
  }

  next();
}

module.exports = {
  blockUnsizedInProduction,
  blockUnsizedInSales,
  validateRawNotProducible,
  validateRawNoGrade,
  validateRawHasSize,
  validateProcessedHasDerivative,
  validateRawProduct,
};
