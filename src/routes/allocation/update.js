import AllocationMaster from "../../../models/allocation_master";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Update allocation
  fastify.put("/:allocation_id", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { allocation_id } = request.params;
        const { allocation_qty, status } = request.body;
        const profile_id = request.token_profile_id;

        if (!UUID_PATTERN.test(allocation_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid allocation_id format",
          });
        }

        const allocation = await AllocationMaster.findByPk(allocation_id);
        if (!allocation) {
          return reply.code(404).send({
            statusCode: 404,
            message: "Allocation not found",
          });
        }

        // Update allowed fields
        const updates = { updated_by: profile_id };
        if (allocation_qty && allocation_qty > 0) {
          updates.allocated_quantity = allocation_qty;
        }
        if (status && ["ALLOCATED", "PENDING_PURCHASE"].includes(status)) {
          updates.status = status;
        }

        await allocation.update(updates);

        return reply.code(200).send({
          statusCode: 200,
          message: "Allocation updated successfully",
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
