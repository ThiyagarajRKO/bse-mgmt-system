import CartonMapping from "../../../models/carton_mapping";
import BatchMaster from "../../../models/batch_master";
import TraceabilityMap from "../../../models/traceability_map";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Get single carton by ID
  fastify.get("/:carton_id", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { carton_id } = request.params;

        const carton = await CartonMapping.findOne({
          where: { carton_id },
          include: [
            { model: BatchMaster, as: "batch" },
            { model: TraceabilityMap, as: "traceability" },
          ],
        });

        if (!carton) {
          return reply.code(404).send({
            statusCode: 404,
            message: "Carton not found",
          });
        }

        return reply.code(200).send({
          statusCode: 200,
          message: "Carton fetched successfully",
          data: carton,
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
