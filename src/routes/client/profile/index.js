import { GetProfileInfo } from "./handlers/info";
import { UpdateBasic } from "./handlers/update_basic";
import { GetByName } from "./handlers/get_by_name";
import { GenerateUsername } from "./handlers/generate_username";

// Schema
import { profileInfoSchema } from "./schema/info";
import { getByNameSchema } from "./schema/get_by_name";

export const profileRoutes = (fastify, opts, done) => {
  fastify.get("/info/get/globally", profileInfoSchema, async (req, reply) => {
    try {
      let params = {
        profile_id: req.query?.user_id,
        current_profile_id: req?.token_profile_id,
      };

      let result = await GetProfileInfo(params, req.session, fastify);
      reply.code(200).send({
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

  fastify.post(
    "/info/get/globally/username",
    getByNameSchema,
    async (req, reply) => {
      try {
        let params = {
          ...req.body,
          current_profile_id: req?.token_profile_id,
        };

        let result = await GetByName(params, req.session, fastify);
        reply.code(200).send({
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
    }
  );

  fastify.get("/info/get/mine", async (req, reply) => {
    try {
      let params = {
        profile_id: req?.token_profile_id,
        current_profile_id: req?.token_profile_id,
        type: "mine",
      };

      let result = await GetProfileInfo(params, req.session, fastify);
      reply.code(200).send({
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

  fastify.post("/update", async (req, reply) => {
    try {
      let params = {
        ...req.body,
        profile_id: req?.token_profile_id,
      };

      let result = await UpdateBasic(params, fastify);
      reply.code(200).send({
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

  fastify.post("/generate/username", async (req, reply) => {
    try {
      let result = await GenerateUsername();
      reply.code(200).send({
        success: true,
        message: "Generated Usernames",
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
