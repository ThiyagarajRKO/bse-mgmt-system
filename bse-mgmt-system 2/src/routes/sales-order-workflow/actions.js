import Orders from "../../../models/orders";
import OrderStatusLog from "../../../models/order_status_log";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Confirm order (DRAFT → CONFIRMED)
  fastify.post("/:order_id/confirm", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { order_id } = request.params;
        const profile_id = request.token_profile_id;

        if (!UUID_PATTERN.test(order_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid order_id format",
          });
        }

        const order = await Orders.findByPk(order_id);
        if (!order) {
          return reply.code(404).send({
            statusCode: 404,
            message: "Order not found",
          });
        }

        if (order.status !== "DRAFT") {
          return reply.code(400).send({
            statusCode: 400,
            message: `Order must be in DRAFT status to confirm. Current status: ${order.status}`,
          });
        }

        // Update order status to CONFIRMED
        await order.update({
          status: "CONFIRMED",
          updated_by: profile_id,
        });

        // Log status change
        await OrderStatusLog.create({
          order_id,
          from_status: "DRAFT",
          to_status: "CONFIRMED",
          changed_by: profile_id,
          reason: "Order confirmed",
        });

        return reply.code(200).send({
          statusCode: 200,
          message: "Order confirmed successfully",
          data: {
            order_id: order.id,
            status: order.status,
            updated_at: order.updatedAt,
          },
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({
          statusCode: 500,
          message: "Internal server error",
          error: err.message,
        });
      }
    },
  });
};
