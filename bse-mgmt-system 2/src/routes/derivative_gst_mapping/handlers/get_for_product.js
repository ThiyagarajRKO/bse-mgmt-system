// routes/derivative_gst_mapping/handlers/get_for_product.js
import models from "../../../models";

/**
 * Get the appropriate GST mapping for a specific product
 * Checks: derivative mapping first → falls back to species level
 */
export const GetForProduct = async ({ product_id }, session, fastify) => {
  try {
    if (!product_id) {
      throw { statusCode: 400, message: "product_id is required" };
    }

    // Get product with related data
    const product = await models.ProductMaster.findByPk(product_id, {
      attributes: [
        "id",
        "product_name",
        "hsn_code",
        "species_master_id",
        "derivative_master_id",
        "processing_state",
      ],
      include: [
        {
          model: models.SpeciesMaster,
          as: "Species",
          attributes: ["id", "species_name", "hsn_code"],
        },
        {
          model: models.DerivativeMaster,
          as: "Derivative",
          attributes: ["id", "derivative_name"],
          required: false,
        },
      ],
    });

    if (!product) {
      throw { statusCode: 404, message: "Product not found" };
    }

    let gstMapping = null;
    let matchType = null;

    // Step 1: Try derivative-specific GST mapping
    if (product.derivative_master_id && product.species_master_id) {
      try {
        gstMapping = await models.DerivativeGstMapping.findActiveMapping(
          product.species_master_id,
          product.derivative_master_id,
          product.processing_state || "PROCESSED",
        );
        if (gstMapping) {
          matchType = "DERIVATIVE_SPECIFIC";
        }
      } catch (err) {
        fastify.log.warn("Error checking derivative mapping:", err.message);
      }
    }

    // Step 2: Try product-level GST mapping
    if (!gstMapping) {
      gstMapping = await models.ProductGstMapping.findOne({
        where: { product_id, is_active: true },
        include: [
          {
            model: models.ConsolidatedGstMaster,
            as: "gst_master",
            attributes: [
              "id",
              "hsn_code",
              "gst_name",
              "cgst_rate",
              "sgst_rate",
              "igst_rate",
            ],
          },
        ],
        paranoid: true,
      });
      if (gstMapping) {
        matchType = "PRODUCT_LEVEL";
      }
    }

    // If still no mapping, construct response with species HSN
    if (!gstMapping) {
      matchType = "SPECIES_FALLBACK";
      gstMapping = {
        id: null,
        hsn_code: product.Species?.hsn_code,
        gst_name: "No mapping found",
        cgst_rate: null,
        sgst_rate: null,
        igst_rate: null,
      };
    }

    return {
      statusCode: 200,
      message: "GST mapping retrieved successfully",
      data: {
        product: {
          id: product.id,
          product_name: product.product_name,
          hsn_code: product.hsn_code,
          species: product.Species?.species_name,
          derivative: product.Derivative?.derivative_name || null,
          processing_state: product.processing_state,
        },
        gst_mapping: gstMapping,
        match_type: matchType,
      },
    };
  } catch (err) {
    fastify.log.error(err);
    throw err;
  }
};
