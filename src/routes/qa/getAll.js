import QAChecklist from "../../../models/qa_checklist";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Get all QA records with pagination and filtering
  fastify.get("/", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { page = 1, limit = 10, lot_no, status, product } = request.query;
        const offset = (page - 1) * limit;

        let query = {};
        if (lot_no)
          query.lot_no = { [fastify.sequelize.Op.like]: `%${lot_no}%` };
        if (status) query.status = status;
        if (product)
          query.product = {
            [fastify.sequelize.Op.like]: `%${product}%`,
          };

        const { count, rows } =
          await fastify.models.QAChecklist.findAndCountAll({
            where: query,
            limit: parseInt(limit),
            offset: offset,
            order: [["created_at", "DESC"]],
            include: [
              {
                model: fastify.models.Orders,
                as: "order",
                required: false,
                attributes: ["id", "order_no"],
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

        return reply.code(200).send({
          statusCode: 200,
          message: "QA records fetched successfully",
          data: rows,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit),
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
