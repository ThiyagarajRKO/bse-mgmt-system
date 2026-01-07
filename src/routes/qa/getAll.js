import QAChecklist from "../../../models/qa_checklist";
import BatchMaster from "../../../models/batch_master";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Get all QA records with pagination and filtering
  fastify.get("/", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { page = 1, limit = 10, batch_id, test_result } = request.query;
        const offset = (page - 1) * limit;

        let query = {};
        if (batch_id && UUID_PATTERN.test(batch_id)) query.batch_id = batch_id;
        if (test_result) query.test_result = test_result;

        const { count, rows } = await QAChecklist.findAndCountAll({
          where: query,
          include: [{ model: BatchMaster, as: "batch" }],
          limit: parseInt(limit),
          offset: offset,
          order: [["createdAt", "DESC"]],
        });

        return reply.code(200).send({
          statusCode: 200,
          message: "QA records fetched successfully",
          data: {
            qa_records: rows,
            pagination: {
              total: count,
              page: parseInt(page),
              limit: parseInt(limit),
              pages: Math.ceil(count / limit),
            },
          },
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
