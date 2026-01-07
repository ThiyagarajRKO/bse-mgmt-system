import LedgerPosting from "../../../models/ledger_posting";
import Orders from "../../../models/orders";

export default async (fastify) => {
  // Get all GL postings with pagination and filtering
  fastify.get("/", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { page = 1, limit = 10, posting_type, status } = request.query;
        const offset = (page - 1) * limit;

        let query = {};
        if (posting_type) query.posting_type = posting_type;
        if (status) query.status = status;

        const { count, rows } = await LedgerPosting.findAndCountAll({
          where: query,
          limit: parseInt(limit),
          offset: offset,
          order: [["posting_date", "DESC"]],
        });

        return reply.code(200).send({
          statusCode: 200,
          message: "GL postings fetched successfully",
          data: {
            postings: rows,
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
