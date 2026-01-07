import SalesOrderWorkflow from "../../controllers/sales_order_workflow";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Create new sales order (DRAFT status)
  fastify.post("/", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { customer_id, order_items, shipping_address } = request.body;
        const profile_id = request.token_profile_id;

        // Validate required fields
        if (!customer_id || !UUID_PATTERN.test(customer_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid or missing customer_id",
          });
        }

        if (!Array.isArray(order_items) || order_items.length === 0) {
          return reply.code(400).send({
            statusCode: 400,
            message: "order_items must be a non-empty array",
          });
        }

        // Validate order_items structure
        for (let item of order_items) {
          if (!item.packing_id || !UUID_PATTERN.test(item.packing_id)) {
            return reply.code(400).send({
              statusCode: 400,
              message: "Invalid packing_id in order_items",
            });
          }
          if (!item.quantity || item.quantity <= 0) {
            return reply.code(400).send({
              statusCode: 400,
              message: "quantity must be a positive number",
            });
          }
        }

        const result = await SalesOrderWorkflow.Create(
          { customer_id, order_items, shipping_address },
          profile_id
        );

        return reply.code(result.statusCode || 201).send({
          statusCode: result.statusCode || 201,
          message: result.message || "Order created successfully",
          data: result.data,
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
