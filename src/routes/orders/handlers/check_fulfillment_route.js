/**
 * Handler for checking order fulfillment route
 * Determines whether an order should be routed to production or procurement
 * based on raw material availability in inventory
 */

import OrderFulfillment from "../../../services/order_fulfillment";

export const CheckFulfillmentRoute = (
  { product_master_id, order_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Validate required parameters
      if (!product_master_id) {
        return reject({
          statusCode: 422,
          message: "product_master_id parameter is required",
        });
      }

      // Determine the fulfillment route based on inventory
      const routeDecision = await OrderFulfillment.determineOrderRoute(
        product_master_id
      );

      resolve({
        statusCode: 200,
        message: `Order routed to ${routeDecision.route}`,
        data: {
          order_id,
          product_master_id,
          fulfillment_route: routeDecision.route,
          reason: routeDecision.reason,
          rawMaterialAvailable: routeDecision.stockCheck?.hasStock || false,
          availableQuantity: routeDecision.stockCheck?.availableQuantity || 0,
          rawMaterial: routeDecision.stockCheck?.rawMaterial,
        },
      });
    } catch (err) {
      console.error("Error checking fulfillment route:", err);
      reject({
        statusCode: 500,
        message: "Error determining order fulfillment route",
        error: err?.message,
      });
    }
  });
};

export default CheckFulfillmentRoute;
