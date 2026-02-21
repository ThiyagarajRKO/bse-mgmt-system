import QAChecklist from "../../../models/qa_checklist";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

        console.log("[QA GET] Route called with qa_id:", qa_id);
        console.log("[QA GET] fastify.models available:", !!fastify.models);
        console.log(
          "[QA GET] QAChecklist model available:",
          !!fastify.models?.QAChecklist,
        );

        const qa = await fastify.models.QAChecklist.findByPk(qa_id, {
          include: [
            {
              model: fastify.models.Orders,
              as: "order",
              attributes: ["id", "order_no"],
              required: false,
            },
            {
              model: fastify.models.Peeling,
              as: "peeling",
              required: false,
              attributes: [
                "id",
                "created_at",
                "peeling_quantity",
                "peeling_method",
              ],
              include: [
                {
                  model: fastify.models.PeelingProducts,
                  required: false,
                  include: [
                    {
                      model: fastify.models.ProductMaster,
                      required: false,
                      attributes: ["id", "product_name"],
                    },
                  ],
                },
              ],
            },
          ],
        });

        if (!qa) {
          console.log("[QA GET] QA record not found for qa_id:", qa_id);
          return reply.code(404).send({
            statusCode: 404,
            message: "QA record not found",
          });
        }

        console.log("[QA GET] QA record found:", {
          qa_id,
          has_order: !!qa.order,
          order_no: qa.order?.order_no,
        });

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
