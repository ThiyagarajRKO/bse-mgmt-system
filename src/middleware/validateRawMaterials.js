"use strict";

/**
 * MIDDLEWARE: Validate RAW material usage rules
 *
 * Enforces:
 * - UNSIZED RAW products can only be used in intake/GRN
 * - UNSIZED cannot be used in Production
 * - UNSIZED cannot be used in Sales
 */

const validateRawMaterialUsage = (req, res, next) => {
  try {
    const { size_code, processing_state, product_id } = req.body;

    // Check if this is a RAW product with UNSIZED
    if (processing_state === "RAW" && size_code === "UNSIZED") {
      // Get the endpoint to determine if this is a blocked operation
      const endpoint = req.path;

      // Block UNSIZED in Production
      if (endpoint.includes("production")) {
        return res.status(400).json({
          error: "UNSIZED_NOT_ALLOWED",
          message:
            "UNSIZED raw materials cannot be used in production. Must complete size sorting first.",
          hint: "Use 'Inventory → Raw Size Sorting' to classify the UNSIZED batch into specific sizes",
        });
      }

      // Block UNSIZED in Sales
      if (endpoint.includes("sales") || endpoint.includes("order")) {
        return res.status(400).json({
          error: "UNSIZED_NOT_ALLOWED",
          message:
            "UNSIZED raw materials cannot be sold. Must complete size sorting first.",
          hint: "Use 'Inventory → Raw Size Sorting' to classify the UNSIZED batch into specific sizes",
        });
      }

      // Block UNSIZED in Transfers
      if (endpoint.includes("transfer") || endpoint.includes("movement")) {
        return res.status(400).json({
          error: "UNSIZED_NOT_ALLOWED",
          message:
            "UNSIZED raw materials cannot be transferred. Must complete size sorting first.",
          hint: "Use 'Inventory → Raw Size Sorting' to classify the UNSIZED batch into specific sizes",
        });
      }
    }

    next();
  } catch (error) {
    console.error("Error in RAW material validation:", error.message);
    return res.status(500).json({
      error: "VALIDATION_ERROR",
      message: error.message,
    });
  }
};

/**
 * Filter visible products based on context
 *
 * - GRN: Show all RAW (including UNSIZED)
 * - Production: Show RAW + PROCESSED (exclude UNSIZED)
 * - Sales: Show PROCESSED + sellable RAW (exclude UNSIZED)
 */
const filterProductsByContext = (context = "general") => {
  return (req, res, next) => {
    try {
      // Attach filter function to request
      req.productFilter = {};

      switch (context) {
        case "grn":
        case "intake":
          // GRN can see all RAW products including UNSIZED
          req.productFilter.where = {
            processing_state: "RAW",
            is_active: true,
          };
          break;

        case "production":
          // Production can see RAW (sized only) + PROCESSED
          // Exclude UNSIZED by adding size check
          req.productFilter.where = {
            is_active: true,
            [require("sequelize").Op.or]: [
              {
                processing_state: "RAW",
                size_code: { [require("sequelize").Op.ne]: "UNSIZED" },
              },
              { processing_state: "PROCESSED" },
            ],
          };
          break;

        case "sales":
          // Sales can see PROCESSED + sellable RAW
          // Exclude RAW UNSIZED
          req.productFilter.where = {
            is_active: true,
            is_sellable: true,
            [require("sequelize").Op.or]: [
              { processing_state: "PROCESSED" },
              {
                processing_state: "RAW",
                is_sellable: true,
                size_code: { [require("sequelize").Op.ne]: "UNSIZED" },
              },
            ],
          };
          break;

        default:
          // General: show all active
          req.productFilter.where = { is_active: true };
      }

      next();
    } catch (error) {
      console.error("Error in product filtering:", error.message);
      return res.status(500).json({
        error: "FILTER_ERROR",
        message: error.message,
      });
    }
  };
};

module.exports = {
  validateRawMaterialUsage,
  filterProductsByContext,
};
