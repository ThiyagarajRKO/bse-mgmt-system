import QAChecklist from "../../../models/qa_checklist";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Create new QA record
  fastify.post("/", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const {
          batch_no,
          order_id,
          peeling_id,
          species_name,
          product_form,
          quantity,
          status = "PENDING",
          inspection_date,
          inspector_name,
          remarks,
          defects,
        } = request.body;
        const profile_id = request.token_profile_id;

        if (!batch_no) {
          return reply.code(400).send({
            statusCode: 400,
            message: "batch_no is required",
          });
        }

        if (
          status &&
          !["PENDING", "PASS", "FAIL", "ON_HOLD"].includes(status)
        ) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid status. Must be PENDING, PASS, FAIL, or ON_HOLD",
          });
        }

        // Create QA record
        const qa = await QAChecklist.create({
          batch_no,
          order_id: order_id || null,
          peeling_id: peeling_id || null,
          species_name,
          product_form,
          quantity: quantity ? parseFloat(quantity) : null,
          status,
          inspection_date: inspection_date ? new Date(inspection_date) : null,
          inspector_name,
          remarks,
          defects,
          created_by: profile_id,
        });

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
