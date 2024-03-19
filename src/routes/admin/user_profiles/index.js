import { ReActivateUser } from "./handlers/activate_client";
import { getAllProfiles } from "./handlers/get_all";

// Schema
import { getProfilesSchema } from "./schema/get_all";
import { reactivateProfilesSchema } from "./schema/activate_client";

export const userProfilesRoute = (fastify, opts, done) => {
  fastify.get("/get/all", getProfilesSchema, async (req, reply) => {
    try {
      let params = {
        ...req.query,
        profile_id: req?.token_profile_id,
      };

      let result = await getAllProfiles(params, fastify);
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

  fastify.post("/reactivate", reactivateProfilesSchema, async (req, reply) => {
    try {
      let result = await ReActivateUser(
        { profile_id: req.body?.user_id },
        fastify
      );
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

  done();
};

export default userProfilesRoute;
