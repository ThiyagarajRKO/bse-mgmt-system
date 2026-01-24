const { Orders } = require("../../../controllers");
const models = require("../../../../models");
const AutoAllocateStock = require("./auto_allocate_stock");

export const Confirm = async ({ profile_id, order_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!order_id) {
        const error = new Error("Order ID is required");
        error.statusCode = 400;
        throw error;
      }

      // Get the order first to check its current status
      const order = await models.Orders.findOne({
        where: { id: order_id },
      });

      if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
      }

      // Check if order is already initiated/confirmed
      if (order.order_status === "CONFIRMED") {
        const error = new Error("Order is already confirmed");
        error.statusCode = 400;
        throw error;
      }

      // Update the order status to CONFIRMED
      await models.Orders.update(
        {
          order_status: "CONFIRMED",
          is_active: true,
          confirmed_at: new Date(),
        },
        {
          where: { id: order_id },
        },
      );

      // Log the status change in audit logs (if OrderStatusLog exists)
      try {
        if (models.OrderStatusLog) {
          await models.OrderStatusLog.create({
            order_id: order_id,
            old_status: order.order_status,
            new_status: "CONFIRMED",
            changed_by: session?.user_id,
            profile_id: profile_id,
            remarks: "Order confirmed and moved to allocation workflow",
          });
        }
      } catch (logErr) {
        // Log error but don't fail the request
        fastify.log.warn("Failed to create status log:", logErr);
      }

      // Trigger auto-allocation for all products in the confirmed order
      try {
        // Get all products in this order
        const orderProducts = await models.OrderProducts.findAll({
          where: {
            order_id: order_id,
            is_active: true,
          },
          attributes: ["product_master_id"],
        });

        if (orderProducts && orderProducts.length > 0) {
          // Get unique product IDs
          const productIds = [
            ...new Set(orderProducts.map((op) => op.product_master_id)),
          ];

          fastify.log.info(
            `Triggering auto-allocation for ${productIds.length} products in order ${order.order_no}`,
          );

          // Trigger auto-allocation for each product
          const allocationPromises = productIds.map(
            (productId) =>
              new Promise((resolveAlloc) => {
                AutoAllocateStock({ product_id: productId }, session, fastify)
                  .then((result) => {
                    fastify.log.info(
                      `Auto-allocation completed for product ${productId}:`,
                      result.message,
                    );
                    resolveAlloc(result);
                  })
                  .catch((error) => {
                    fastify.log.error(
                      `Auto-allocation failed for product ${productId}:`,
                      error.message,
                    );
                    // Don't fail the confirmation if allocation fails
                    resolveAlloc({ error: error.message });
                  });
              }),
          );

          // Wait for all allocations to complete (but don't block confirmation)
          Promise.allSettled(allocationPromises).then((results) => {
            const successful = results.filter(
              (r) => r.status === "fulfilled" && !r.value.error,
            ).length;
            const failed = results.filter(
              (r) => r.status === "rejected" || r.value.error,
            ).length;
            fastify.log.info(
              `Auto-allocation summary for order ${order.order_no}: ${successful} successful, ${failed} failed`,
            );
          });
        }
      } catch (allocErr) {
        // Log allocation error but don't fail order confirmation
        fastify.log.error("Failed to trigger auto-allocation:", allocErr);
      }

      resolve({
        statusCode: 200,
        message: "Order confirmed successfully",
        data: {
          order_id: order_id,
          status: "CONFIRMED",
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject({
        statusCode: err?.statusCode || 400,
        message: err?.message || "Failed to confirm order",
      });
    }
  });
};
