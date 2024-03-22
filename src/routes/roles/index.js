import { GetAll } from "./handlers/get_all";

export const rolesRoute = (fastify, opts, done) => {
  fastify.get("/get/all", async (req, reply) => {
    try {
      let result = await GetAll(
        { profile_id: req?.token_profile_id },
        req?.session,
        fastify
      );

      reply.code(200).send({
        success: true,
        data: result,
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

export default rolesRoute;
