import { Orders } from "../../../controllers";
import models from "../../../../models";

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
      if (order.delivery_status === "Initiated") {
        const error = new Error("Order is already confirmed");
        error.statusCode = 400;
        throw error;
      }

      // Update the order status to Initiated (confirmed state)
      await models.Orders.update(
        {
          delivery_status: "Initiated",
          is_active: true,
          confirmed_at: new Date(),
        },
        {
          where: { id: order_id },
        }
      );

      // Log the status change in audit logs (if OrderStatusLog exists)
      try {
        if (models.OrderStatusLog) {
          await models.OrderStatusLog.create({
            order_id: order_id,
            old_status: order.delivery_status,
            new_status: "Initiated",
            changed_by: session?.user_id,
            profile_id: profile_id,
            remarks: "Order confirmed and moved to allocation workflow",
          });
        }
      } catch (logErr) {
        // Log error but don't fail the request
        fastify.log.warn("Failed to create status log:", logErr);
      }

      resolve({
        statusCode: 200,
        message: "Order confirmed successfully",
        data: {
          order_id: order_id,
          status: "Initiated",
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
