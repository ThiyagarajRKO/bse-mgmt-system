import BatchMaster from "../../../models/batch_master";
import ProductionSchedule from "../../../models/production_schedule";
import Orders from "../../../models/orders";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Create new batch and start production
  fastify.post("/", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const {
          order_id,
          species_id,
          product_form,
          input_quantity_kg,
          expected_yield_qty,
        } = request.body;
        const profile_id = request.token_profile_id;

        // Validate required fields
        if (!order_id || !UUID_PATTERN.test(order_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid or missing order_id",
          });
        }

        if (!species_id || !UUID_PATTERN.test(species_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid or missing species_id",
          });
        }

        if (!input_quantity_kg || input_quantity_kg <= 0) {
          return reply.code(400).send({
            statusCode: 400,
            message: "input_quantity_kg must be a positive number",
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

        if (order.status !== "ALLOCATED") {
          return reply.code(400).send({
            statusCode: 400,
            message: `Order must be ALLOCATED to start production. Current status: ${order.status}`,
          });
        }

        // Create batch
        const batch = await BatchMaster.create({
          order_id,
          species_id,
          product_form: product_form || "FROZEN",
          batch_status: "CREATED",
          input_quantity_kg,
          expected_yield_qty: expected_yield_qty || input_quantity_kg * 0.95,
          created_by: profile_id,
        });

        // Create production schedule
        const schedule = await ProductionSchedule.create({
          batch_id: batch.id,
          scheduled_start_date: new Date(),
          expected_completion_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: "SCHEDULED",
          created_by: profile_id,
        });

        // Update order status
        await order.update({
          status: "IN_PRODUCTION",
          updated_by: profile_id,
        });

        return reply.code(201).send({
          statusCode: 201,
          message: "Production started successfully",
          data: {
            batch,
            schedule,
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
