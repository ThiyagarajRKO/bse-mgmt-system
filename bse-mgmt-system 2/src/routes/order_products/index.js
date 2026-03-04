import { GetAll } from "./handlers/get_all";
import { Delete } from "./handlers/delete";
import { GetPaymentItems } from "./handlers/get_payment_products";
import { GetMatchingRawMaterialsHandler } from "./handlers/get_matching_raw_materials";

// Schema
import { getAllSchema } from "./schema/get_all";
import { deleteSchema } from "./schema/delete";
import { getPaymentItemsSchema } from "./schema/get_payment_products";

export const orderProductsRoute = (fastify, opts, done) => {
  fastify.get("/", async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await GetAll(params, req?.session, fastify);

      // Format response for DataTables server-side processing
      const data = result?.data || {};
      const draw = parseInt(req.query.draw) || 1;

      return reply.code(result.statusCode || 200).send({
        draw: draw,
        recordsTotal: data.count || 0,
        recordsFiltered: data.count || 0,
        data: data.rows || [],
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        draw: parseInt(req.query.draw) || 1,
        recordsTotal: 0,
        recordsFiltered: 0,
        data: [],
        error: err?.message || err,
      });
    }
  });

  fastify.get("/payment/items", getPaymentItemsSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await GetPaymentItems(params, req?.session, fastify);

      return reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  // Get raw materials matching the species of an ordered product
  fastify.get(
    "/matching-raw-materials/:order_product_id",
    async (req, reply) => {
      try {
        const params = {
          profile_id: req?.token_profile_id,
          order_product_id: req.params.order_product_id,
          ...req.query,
        };

        const result = await GetMatchingRawMaterialsHandler(
          params,
          req?.session,
          fastify,
        );

        return reply.code(result.statusCode || 200).send({
          success: true,
          message: result.message,
          data: result?.data,
        });
      } catch (err) {
        return reply.code(err?.statusCode || 400).send({
          success: false,
          message: err?.message || err,
        });
      }
    },
  );

  fastify.delete("/", deleteSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await Delete(params, req?.session, fastify);

      return reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  done();
};

export default orderProductsRoute;
