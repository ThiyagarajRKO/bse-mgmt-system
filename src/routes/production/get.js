import BatchMaster from "../../../models/batch_master";
import ProductionSchedule from "../../../models/production_schedule";
import Orders from "../../../models/orders";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Get single batch by ID
  fastify.get("/:batch_id", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { batch_id } = request.params;

        if (!UUID_PATTERN.test(batch_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid batch_id format",
          });
        }

        const batch = await BatchMaster.findByPk(batch_id, {
          include: [
            { model: Orders, as: "order" },
            { model: ProductionSchedule, as: "schedule" },
          ],
        });

        if (!batch) {
          return reply.code(404).send({
            statusCode: 404,
            message: "Batch not found",
          });
        }

        return reply.code(200).send({
          statusCode: 200,
          message: "Batch fetched successfully",
          data: batch,
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
