import QAChecklist from "../../../models/qa_checklist";
import BatchMaster from "../../../models/batch_master";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Create new QA record
  fastify.post("/", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const {
          batch_id,
          appearance,
          odor,
          texture,
          temperature_celsius,
          test_result,
          remarks,
        } = request.body;
        const profile_id = request.token_profile_id;

        if (!batch_id || !UUID_PATTERN.test(batch_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid or missing batch_id",
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

        // Create QA record
        const qa = await QAChecklist.create({
          batch_id,
          appearance,
          odor,
          texture,
          temperature_celsius,
          test_result: test_result || "PENDING",
          remarks,
          checked_by: profile_id,
          checked_at: new Date(),
        });

        // Update batch status based on test result
        if (test_result === "PASSED") {
          await batch.update({ batch_status: "QA_APPROVED", updated_by: profile_id });
        } else if (test_result === "FAILED") {
          await batch.update({ batch_status: "QA_REJECTED", updated_by: profile_id });
        }

        return reply.code(201).send({
          statusCode: 201,
          message: "QA record created successfully",
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
