/**
 * Routes for linking orders and production orders
 */
import {
  LinkToOrder,
  GetProductionOrdersByOrder,
  GetOrderByProduction,
} from "./handlers/link_to_order";

export default async (fastify) => {
  // Link production order to sales order
  fastify.post("/:production_order_id/link-to-order", async (req, reply) => {
    try {
      const { production_order_id } = req.params;
      const { order_id } = req.body;

      const result = await LinkToOrder(
        { production_order_id, order_id },
        req.session,
        fastify
      );

      return reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  // Get all production orders for a sales order
  fastify.get("/by-order/:order_id", async (req, reply) => {
    try {
      const { order_id } = req.params;

      const result = await GetProductionOrdersByOrder(
        { order_id },
        req.session,
        fastify
      );

      return reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  // Get sales order details by production order
  fastify.get("/:production_order_id/get-order", async (req, reply) => {
    try {
      const { production_order_id } = req.params;

      const result = await GetOrderByProduction(
        { production_order_id },
        req.session,
        fastify
      );

      return reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });
};
