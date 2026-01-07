import Orders from "../../../models/orders";
import OrderProducts from "../../../models/order_products";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Get single sales order by ID
  fastify.get("/:order_id", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { order_id } = request.params;

        if (!UUID_PATTERN.test(order_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid order_id format",
          });
        }

        const order = await Orders.findByPk(order_id, {
          include: [{ model: OrderProducts, as: "order_items" }],
        });

        if (!order) {
          return reply.code(404).send({
            statusCode: 404,
            message: "Order not found",
          });
        }

        return reply.code(200).send({
          statusCode: 200,
          message: "Order fetched successfully",
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
