import { GetProfileInfo } from "./handlers/info";
import { Update } from "./handlers/update";

export const profileRoutes = (fastify, opts, done) => {
  fastify.get("/info", async (req, reply) => {
    try {
      let params = {
        profile_id: req?.token_profile_id,
        current_profile_id: req?.token_profile_id,
        type: "mine",
      };

      let result = await GetProfileInfo(params, req.session, fastify);
      reply.code(result.statusCode || 200).send({
        success: true,
        message: result?.message,
        data: result?.data,
      });
    } catch (err) {
      reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.put("/", async (req, reply) => {
    try {
      let params = {
        ...req.body,
        profile_id: req?.token_profile_id,
      };

      let result = await Update(params, fastify);
      reply.code(result.statusCode || 200).send({
        success: true,
        message: result?.message,
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

export default profileRoutes;
