import AllocationMaster from "../../../models/allocation_master";
import Orders from "../../../models/orders";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Get single allocation by ID
  fastify.get("/:allocation_id", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { allocation_id } = request.params;

        if (!UUID_PATTERN.test(allocation_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid allocation_id format",
          });
        }

        const allocation = await AllocationMaster.findByPk(allocation_id, {
          include: [{ model: Orders, as: "order" }],
        });

        if (!allocation) {
          return reply.code(404).send({
            statusCode: 404,
            message: "Allocation not found",
          });
        }

        return reply.code(200).send({
          statusCode: 200,
          message: "Allocation fetched successfully",
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
