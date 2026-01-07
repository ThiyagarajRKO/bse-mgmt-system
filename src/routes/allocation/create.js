import AllocationMaster from "../../../models/allocation_master";
import Orders from "../../../models/orders";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Create new allocation
  fastify.post("/", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { order_id, inventory_id, allocation_qty } = request.body;
        const profile_id = request.token_profile_id;

        // Validate required fields
        if (!order_id || !UUID_PATTERN.test(order_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid or missing order_id",
          });
        }

        if (!inventory_id || !UUID_PATTERN.test(inventory_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid or missing inventory_id",
          });
        }

        if (!allocation_qty || allocation_qty <= 0) {
          return reply.code(400).send({
            statusCode: 400,
            message: "allocation_qty must be a positive number",
          });
        }

        // Check order status
        const order = await Orders.findByPk(order_id);
        if (!order) {
          return reply.code(404).send({
            statusCode: 404,
            message: "Order not found",
          });
        }

        if (order.status !== "CONFIRMED") {
          return reply.code(400).send({
            statusCode: 400,
            message: `Order must be CONFIRMED to allocate. Current status: ${order.status}`,
          });
        }

        // Create allocation
        const allocation = await AllocationMaster.create({
          order_id,
          inventory_id,
          allocation_qty,
          status: "ALLOCATED",
          created_by: profile_id,
        });

        // Update order status to ALLOCATED
        await order.update({
          status: "ALLOCATED",
          updated_by: profile_id,
        });

        return reply.code(201).send({
          statusCode: 201,
          message: "Allocation created successfully",
          data: allocation,
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
