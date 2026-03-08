import { Delete } from "./handlers/delete";
import { GetNames } from "./handlers/get_names";
import { GetQAMetrics } from "../../controllers/peeling_products";

// Schema
import { deleteSchema } from "./schema/delete";
import { getNamesSchema } from "./schema/get_names";

export const peelingProductRoute = (fastify, opts, done) => {
  fastify.get("/names", getNamesSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await GetNames(params, req?.session, fastify);

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

  fastify.get("/qa-metrics/:procurement_lot_id", async (req, reply) => {
    try {
      const { procurement_lot_id } = req.params;

      const result = await GetQAMetrics({ procurement_lot_id });

      return reply.code(200).send({
        success: true,
        message: "QA metrics retrieved successfully",
        data: result,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

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

export default peelingProductRoute;
