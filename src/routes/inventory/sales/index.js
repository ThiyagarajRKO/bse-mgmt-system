import { Get } from "./handlers/get";
import { GetAll } from "./handlers/get_all";

// Schema
import { getSchema } from "./schema/get";
import { getAllSchema } from "./schema/get_all";

export const salesInventoryRoute = (fastify, opts, done) => {
  fastify.get("/", getSchema, async (req, reply) => {
    try {
      let result = await Get({ ...req.query }, req?.session, fastify);

      return reply.code(result.statusCode || 200).send(result);
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.get("/all", getAllSchema, async (req, reply) => {
    try {
      let result = await GetAll(
        { profile_id: req?.token_profile_id, ...req.query },
        req?.session,
        fastify,
      );

      return reply.code(result.statusCode || 200).send(result);
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  done();
};

export default salesInventoryRoute;
