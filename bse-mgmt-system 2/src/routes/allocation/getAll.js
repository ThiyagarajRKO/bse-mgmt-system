import AllocationMaster from "../../../models/allocation_master";
import Orders from "../../../models/orders";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Get all allocations with pagination and filtering
  fastify.get("/", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { page = 1, limit = 10, order_id, status } = request.query;
        const offset = (page - 1) * limit;

        let query = {};
        if (order_id && UUID_PATTERN.test(order_id)) query.order_id = order_id;
        if (status) query.status = status;

        const { count, rows } = await AllocationMaster.findAndCountAll({
          where: query,
          include: [{ model: Orders, as: "order" }],
          limit: parseInt(limit),
          offset: offset,
          order: [["createdAt", "DESC"]],
        });

        return reply.code(200).send({
          statusCode: 200,
          message: "Allocations fetched successfully",
          data: {
            allocations: rows,
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
