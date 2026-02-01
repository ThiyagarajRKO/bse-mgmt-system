const PurchaseRequestService = require("../../../../services/PurchaseRequestService.js");

export const UpdateProcurementWithRecommendedQuantities = (
  { orderId, productUpdates },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!orderId) {
        return reject({
          statusCode: 400,
          message: "Order ID is required",
        });
      }

      if (
        !productUpdates ||
        !Array.isArray(productUpdates) ||
        productUpdates.length === 0
      ) {
        return reject({
          statusCode: 400,
          message: "Product updates array is required and must not be empty",
        });
      }

      // Validate productUpdates format
      for (const update of productUpdates) {
        if (!update.productId || !update.recommendedQuantity) {
          return reject({
            statusCode: 400,
            message:
              "Each product update must have productId and recommendedQuantity",
          });
        }
        if (update.recommendedQuantity <= 0) {
          return reject({
            statusCode: 400,
            message: "Recommended quantity must be greater than 0",
          });
        }
      }

      const result =
        await PurchaseRequestService.updateProcurementWithRecommendedQuantities(
          orderId,
          productUpdates,
        );

      resolve({
        statusCode: 200,
        message: result.message,
        data: result,
      });
    } catch (err) {
      fastify.log.error(
        "UpdateProcurementWithRecommendedQuantities Error:",
        err,
      );
      reject({
        statusCode: 500,
        message: err.message || "Failed to update procurement quantities",
      });
    }
  });
};

export const CalculateAndUpdateProcurementQuantities = (
  { orderId },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!orderId) {
        return reject({
          statusCode: 400,
          message: "Order ID is required",
        });
      }

      const result =
        await PurchaseRequestService.calculateAndUpdateProcurementQuantities(
          orderId,
        );

      resolve({
        statusCode: 200,
        message: result.message,
        data: result,
      });
    } catch (err) {
      fastify.log.error("CalculateAndUpdateProcurementQuantities Error:", err);
      reject({
        statusCode: 500,
        message:
          err.message ||
          "Failed to calculate and update procurement quantities",
      });
    }
  });
};
