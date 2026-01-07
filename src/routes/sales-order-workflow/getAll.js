import Orders from "../../../models/orders";
import OrderProducts from "../../../models/order_products";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Get all sales orders with pagination and filtering
  fastify.get("/", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { page = 1, limit = 10, status, customer_id } = request.query;
        const offset = (page - 1) * limit;

        let query = {};
        if (status) query.status = status;
        if (customer_id && UUID_PATTERN.test(customer_id)) {
          query.customer_id = customer_id;
        }

        const { count, rows } = await Orders.findAndCountAll({
          where: query,
          include: [{ model: OrderProducts, as: "order_items" }],
          limit: parseInt(limit),
          offset: offset,
          order: [["createdAt", "DESC"]],
        });

        return reply.code(200).send({
          statusCode: 200,
          message: "Orders fetched successfully",
          data: {
            orders: rows,
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
