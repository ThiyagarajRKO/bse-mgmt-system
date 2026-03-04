import CartonMapping from "../../../models/carton_mapping";
import BatchMaster from "../../../models/batch_master";
import TraceabilityMap from "../../../models/traceability_map";

export default async (fastify) => {
  // Get all cartons with pagination and filtering
  fastify.get("/", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { page = 1, limit = 10, batch_id } = request.query;
        const offset = (page - 1) * limit;

        let query = {};
        if (batch_id) query.batch_id = batch_id;

        const { count, rows } = await CartonMapping.findAndCountAll({
          where: query,
          include: [
            { model: BatchMaster, as: "batch" },
            { model: TraceabilityMap, as: "traceability" },
          ],
          limit: parseInt(limit),
          offset: offset,
          order: [["createdAt", "DESC"]],
        });

        return reply.code(200).send({
          statusCode: 200,
          message: "Cartons fetched successfully",
          data: {
            cartons: rows,
            pagination: {
              total: count,
              page: parseInt(page),
              limit: parseInt(limit),
              pages: Math.ceil(count / limit),
            },
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
