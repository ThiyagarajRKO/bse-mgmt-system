/**
 * Order Fulfillment Service
 * Handles inventory checking and routing orders to either production or procurement
 */

import models from "../../models";
import { Op } from "sequelize";

/**
 * Check if raw material/ingredient is available in inventory for an ordered product
 * @param {string} product_master_id - The ID of the ordered product
 * @returns {Promise<Object>} - { hasStock: boolean, availableQuantity: number, rawMaterial: Object }
 */
export const checkRawMaterialAvailability = async (product_master_id) => {
  try {
    // Get the product details with its derivative
    const product = await models.ProductMaster.findOne({
      where: {
        id: product_master_id,
        is_active: true,
      },
      attributes: [
        "id",
        "product_name",
        "derivative_master_id",
        "product_category_master_id",
      ],
      include: [
        {
          model: models.DerivativeMaster,
          attributes: ["id", "derivative_code", "derivative_name"],
          where: { is_active: true },
          required: false,
        },
      ],
    });

    if (!product) {
      return {
        hasStock: false,
        availableQuantity: 0,
        rawMaterial: null,
        error: "Product not found",
      };
    }

    // Determine what raw material derivative we're looking for
    // For processed products, we look for their raw material equivalent
    const derivative = product.Derivative || product.DerivativeMaster;

    if (!derivative) {
      return {
        hasStock: false,
        availableQuantity: 0,
        rawMaterial: null,
        error: "No derivative found for product",
      };
    }

    // Find the raw material equivalent for this product's derivative
    // Raw materials typically have "RAW" in their derivative code
    const rawMaterialDerivatives = await models.DerivativeMaster.findAll({
      where: {
        derivative_code: {
          [Op.iLike]: "RAW%",
        },
        is_active: true,
      },
      attributes: ["id", "derivative_code", "derivative_name"],
    });

    if (!rawMaterialDerivatives || rawMaterialDerivatives.length === 0) {
      return {
        hasStock: false,
        availableQuantity: 0,
        rawMaterial: null,
        error: "No raw material derivatives found",
      };
    }

    const rawMaterialDerivativeIds = rawMaterialDerivatives.map((d) => d.id);

    // Check inventory for products with raw material derivatives matching the species
    const inventoryStock = await models.ProductMaster.findOne({
      where: {
        product_category_master_id: product.product_category_master_id,
        derivative_master_id: rawMaterialDerivativeIds,
        is_active: true,
      },
      attributes: ["id", "product_name", "derivative_master_id"],
      include: [
        {
          model: models.Packing,
          where: { is_active: true },
          required: false,
          attributes: ["id", "quantity", "product_master_id"],
          include: [
            {
              model: models.PeeledDispatches,
              where: { is_active: true },
              required: false,
              attributes: ["id", "quantity"],
            },
          ],
        },
      ],
      raw: false,
    });

    if (!inventoryStock) {
      return {
        hasStock: false,
        availableQuantity: 0,
        rawMaterial: null,
        message: "No raw material in inventory for this product",
      };
    }

    // Calculate available quantity from packing records
    let totalAvailableQuantity = 0;

    if (inventoryStock.Packings && inventoryStock.Packings.length > 0) {
      inventoryStock.Packings.forEach((packing) => {
        if (packing.quantity) {
          // Subtract dispatched quantity if available
          const dispatchedQuantity = packing.PeeledDispatches
            ? packing.PeeledDispatches.reduce(
                (sum, dispatch) => sum + (dispatch.quantity || 0),
                0
              )
            : 0;

          totalAvailableQuantity += packing.quantity - dispatchedQuantity;
        }
      });
    }

    return {
      hasStock: totalAvailableQuantity > 0,
      availableQuantity: totalAvailableQuantity,
      rawMaterial: {
        id: inventoryStock.id,
        name: inventoryStock.product_name,
        derivative_id: inventoryStock.derivative_master_id,
      },
      message: `Found ${totalAvailableQuantity} units of raw material in inventory`,
    };
  } catch (err) {
    console.error("Error checking raw material availability:", err);
    return {
      hasStock: false,
      availableQuantity: 0,
      rawMaterial: null,
      error: err.message,
    };
  }
};

/**
 * Determine order fulfillment route based on inventory availability
 * @param {string} product_master_id - The ID of the ordered product
 * @returns {Promise<string>} - "PRODUCTION" if raw material is in stock, "PROCUREMENT" if not
 */
export const determineOrderRoute = async (product_master_id) => {
  try {
    const stockCheck = await checkRawMaterialAvailability(product_master_id);

    if (stockCheck.hasStock) {
      return {
        route: "PRODUCTION",
        reason: "Raw material available in inventory",
        stockCheck,
      };
    } else {
      return {
        route: "PROCUREMENT",
        reason: stockCheck.error || "Raw material not available",
        stockCheck,
      };
    }
  } catch (err) {
    console.error("Error determining order route:", err);
    return {
      route: "PROCUREMENT",
      reason: "Error checking inventory, defaulting to procurement",
      error: err.message,
    };
  }
};

/**
 * Create order fulfillment path for an order product
 * Links order to either production or procurement based on inventory
 * @param {Object} orderProduct - The order product details
 * @param {string} orderId - The order ID
 * @param {string} profileId - The user profile ID
 * @returns {Promise<Object>} - The created fulfillment record
 */
export const createOrderFulfillmentPath = async (
  orderProduct,
  orderId,
  profileId
) => {
  try {
    const routeDecision = await determineOrderRoute(
      orderProduct.product_master_id
    );

    // Store the routing decision in order or create a fulfillment record
    // This can be extended based on your specific fulfillment tracking table

    return {
      order_id: orderId,
      order_product_id: orderProduct.id,
      product_master_id: orderProduct.product_master_id,
      fulfillment_route: routeDecision.route,
      reason: routeDecision.reason,
      raw_material_id: routeDecision.stockCheck?.rawMaterial?.id,
      available_quantity: routeDecision.stockCheck?.availableQuantity || 0,
      status: "PENDING",
      created_by: profileId,
    };
  } catch (err) {
    console.error("Error creating order fulfillment path:", err);
    throw err;
  }
};

export default {
  checkRawMaterialAvailability,
  determineOrderRoute,
  createOrderFulfillmentPath,
};
