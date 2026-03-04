import QAChecklist from "../../../models/qa_checklist";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Update QA record
  fastify.put("/:qa_id", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { qa_id } = request.params;
        const { status, inspection_date, inspector_name, remarks, defects } =
          request.body;
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

        // Update status if provided
        if (status && ["PENDING", "PASS", "FAIL", "ON_HOLD"].includes(status)) {
          updates.status = status;
        }

        // Update inspection_date if provided
        if (inspection_date) {
          updates.inspection_date = new Date(inspection_date);
        }

        // Update inspector_name if provided
        if (inspector_name) {
          updates.inspector_name = inspector_name;
        }

        // Update remarks if provided
        if (remarks) {
          updates.remarks = remarks;
        }

        // Update defects if provided
        if (defects) {
          updates.defects = defects;
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
