import QAChecklist from "../../../models/qa_checklist";
import BatchMaster from "../../../models/batch_master";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Update QA record
  fastify.put("/:qa_id", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { qa_id } = request.params;
        const { test_result, remarks } = request.body;
        const profile_id = request.token_profile_id;

        if (!UUID_PATTERN.test(qa_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid qa_id format",
          });
        }

        const qa = await QAChecklist.findByPk(qa_id);
        if (!qa) {
          return reply.code(404).send({
            statusCode: 404,
            message: "QA record not found",
          });
        }

        const updates = { updated_by: profile_id };

        // Update test result if provided
        if (test_result && ["PASSED", "FAILED", "CONDITIONAL", "PENDING"].includes(test_result)) {
          updates.test_result = test_result;
          
          // Update batch status accordingly
          const batch = await BatchMaster.findByPk(qa.batch_id);
          if (batch) {
            if (test_result === "PASSED") {
              await batch.update({ batch_status: "QA_APPROVED", updated_by: profile_id });
            } else if (test_result === "FAILED") {
              await batch.update({ batch_status: "QA_REJECTED", updated_by: profile_id });
            }
          }
        }

        // Update remarks if provided
        if (remarks) {
          updates.remarks = remarks;
        }

        await qa.update(updates);

        return reply.code(200).send({
          statusCode: 200,
          message: "QA record updated successfully",
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
