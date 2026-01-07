import CartonMapping from "../../../models/carton_mapping";
import BatchMaster from "../../../models/batch_master";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Create new carton
  fastify.post("/", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { batch_id, net_weight_kg, remarks } = request.body;
        const profile_id = request.token_profile_id;

        if (!batch_id || !UUID_PATTERN.test(batch_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid or missing batch_id",
          });
        }

        if (!net_weight_kg || net_weight_kg <= 0) {
          return reply.code(400).send({
            statusCode: 400,
            message: "net_weight_kg must be a positive number",
          });
        }

        // Check batch exists
        const batch = await BatchMaster.findByPk(batch_id);
        if (!batch) {
          return reply.code(404).send({
            statusCode: 404,
            message: "Batch not found",
          });
        }

        // Create carton with auto-generated ID
        const carton = await CartonMapping.create({
          batch_id,
          carton_id: `CTN-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          net_weight_kg,
          seal_status: "OPEN",
          remarks,
          created_by: profile_id,
        });

        return reply.code(201).send({
          statusCode: 201,
          message: "Carton created successfully",
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
