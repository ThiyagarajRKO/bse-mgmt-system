import CartonMapping from "../../../models/carton_mapping";

export default async (fastify) => {
  // Update carton
  fastify.put("/:carton_id", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { carton_id } = request.params;
        const { seal_status, net_weight_kg, remarks } = request.body;
        const profile_id = request.token_profile_id;

        const carton = await CartonMapping.findOne({
          where: { carton_id },
        });

        if (!carton) {
          return reply.code(404).send({
            statusCode: 404,
            message: "Carton not found",
          });
        }

        const updates = { updated_by: profile_id };

        // Update seal status if provided
        if (seal_status && ["OPEN", "SEALED"].includes(seal_status)) {
          updates.seal_status = seal_status;
          if (seal_status === "SEALED") {
            updates.sealed_at = new Date();
          }
        }

        // Update weight if provided
        if (net_weight_kg && net_weight_kg > 0) {
          updates.net_weight_kg = net_weight_kg;
        }

        // Update remarks if provided
        if (remarks) {
          updates.remarks = remarks;
        }

        await carton.update(updates);

        return reply.code(200).send({
          statusCode: 200,
          message: "Carton updated successfully",
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
