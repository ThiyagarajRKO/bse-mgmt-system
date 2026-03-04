import Orders from "../../../models/orders";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Update sales order
  fastify.put("/:order_id", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { order_id } = request.params;
        const { shipping_address, remarks } = request.body;
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

        // Only allow updates for DRAFT status
        if (order.status !== "DRAFT") {
          return reply.code(400).send({
            statusCode: 400,
            message: "Can only update orders in DRAFT status",
          });
        }

        await order.update(
          {
            ...(shipping_address && { shipping_address }),
            ...(remarks && { remarks }),
            updated_by: profile_id,
          }
        );

        return reply.code(200).send({
          statusCode: 200,
          message: "Order updated successfully",
          data: order,
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
