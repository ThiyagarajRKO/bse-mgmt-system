import TaxCode from "../../../models/tax_code_master";
import PackagingMaster from "../../../models/packaging_master";

export default async (fastify) => {
  // Get all tax codes with pagination and filtering
  fastify.get("/", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { page = 1, limit = 10, supply_type } = request.query;
        const offset = (page - 1) * limit;

        let query = {};
        if (supply_type) query.supply_type = supply_type;

        const { count, rows } = await TaxCode.findAndCountAll({
          where: query,
          include: [{ model: PackagingMaster, as: "product" }],
          limit: parseInt(limit),
          offset: offset,
          order: [["createdAt", "DESC"]],
        });

        return reply.code(200).send({
          statusCode: 200,
          message: "Tax codes fetched successfully",
          data: {
            tax_codes: rows,
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
