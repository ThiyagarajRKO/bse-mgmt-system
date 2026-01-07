import QAChecklist from "../../../models/qa_checklist";
import BatchMaster from "../../../models/batch_master";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Get single QA record by ID
  fastify.get("/:qa_id", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { qa_id } = request.params;

        if (!UUID_PATTERN.test(qa_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid qa_id format",
          });
        }

        const qa = await QAChecklist.findByPk(qa_id, {
          include: [{ model: BatchMaster, as: "batch" }],
        });

        if (!qa) {
          return reply.code(404).send({
            statusCode: 404,
            message: "QA record not found",
          });
        }

        return reply.code(200).send({
          statusCode: 200,
          message: "QA record fetched successfully",
          data: qa,
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
