import BatchMaster from "../../../models/batch_master";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Update batch
  fastify.put("/:batch_id", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { batch_id } = request.params;
        const { actual_yield_qty, batch_status } = request.body;
        const profile_id = request.token_profile_id;

        if (!UUID_PATTERN.test(batch_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid batch_id format",
          });
        }

        const batch = await BatchMaster.findByPk(batch_id);
        if (!batch) {
          return reply.code(404).send({
            statusCode: 404,
            message: "Batch not found",
          });
        }

        const updates = { updated_by: profile_id };

        // Update actual yield if provided
        if (actual_yield_qty !== undefined && actual_yield_qty >= 0) {
          updates.actual_yield_qty = actual_yield_qty;
          
          // Calculate yield variance
          if (batch.expected_yield_qty > 0) {
            updates.yield_variance_pct =
              ((actual_yield_qty - batch.expected_yield_qty) /
                batch.expected_yield_qty) *
              100;
          }
        }

        // Update batch status if provided
        if (
          batch_status &&
          ["CREATED", "IN_PRODUCTION", "YIELD_RECORDED", "QA_PENDING"].includes(
            batch_status
          )
        ) {
          updates.batch_status = batch_status;
        }

        await batch.update(updates);

        return reply.code(200).send({
          statusCode: 200,
          message: "Batch updated successfully",
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
