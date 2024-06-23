import { GetAll } from "./handlers/get_all";
import { Get } from "./handlers/get";

// Schema
import { getAllSchema } from "./schema/get_all";
import { getSchema } from "./schema/get";

export const purchaseInventoryRoute = (fastify, opts, done) => {
  fastify.get("/", getAllSchema, async (req, reply) => {
    try {
      let result = await GetAll(
        { profile_id: req?.token_profile_id },
        req?.session,
        fastify
      );

      reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.get("/:purchase_inventory_id", getSchema, async (req, reply) => {
    try {
      let result = await Get(
        { profile_id: req?.token_profile_id, ...req.params },
        req?.session,
        fastify
      );

      reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  done();
};

export default purchaseInventoryRoute;
