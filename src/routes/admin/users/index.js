import { SignIn } from "./handlers/signin";
import { ValidateMFACode } from "./handlers/mfa_validate";
import { ValidateOTP } from "./handlers/otp_validation";
import { SignOut } from "./handlers/signout";

import { ValidateUser } from "../../../middlewares/authentication";

// Schema
import { signInSchema } from "./schema/signin";
import { mfaValidationSchema } from "./schema/mfa_validation";
import { otpValidationSchema } from "./schema/otp_validation";

export const usersRoutes = (fastify, opts, done) => {
  fastify.post("/signin", signInSchema, async (req, reply) => {
    try {
      let result = await SignIn(req.body, req.session, fastify);
      reply.code(200).send({
        success: true,
        message: result?.message || "Signed in successfully",
        data: result?.data,
      });
    } catch (err) {
      reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
        data: err?.data,
      });
    }
  });

  fastify.post("/validate/otp", otpValidationSchema, async (req, reply) => {
    try {
      let params = {
        user_id: req?.session?.uid,
        ...req.body,
      };

      let result = await ValidateOTP(params, req.session, fastify);
      reply.code(200).send({
        success: true,
        message: result?.message || "Signed in successfully",
        data: result?.data,
      });
    } catch (err) {
      reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
        data: err?.data,
      });
    }
  });

  fastify.post("/validate/mfa", mfaValidationSchema, async (req, reply) => {
    try {
      let params = {
        user_id: req?.session?.uid,
        is_otp_verified: req?.session?.is_otp_verified,
        ...req.body,
      };

      let result = await ValidateMFACode(params, req.session, fastify);
      reply.code(200).send({
        success: true,
        message: result?.message || "Signed in successfully",
        data: result?.data,
      });
    } catch (err) {
      reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
        data: err?.data,
      });
    }
  });

  fastify.get(
    "/signout",
    // {
    // preHandler: [ValidateUser],
    // },
    async (req, reply) => {
      try {
        let result = {};
        if (req?.token_profile_id) {
          result = await SignOut(
            { profile_id: req?.token_profile_id },
            req?.session
          );
        }

        req.session.destroy();
        reply.clearCookie("sessionId");

        reply.code(200).send({
          success: true,
          message: result?.messsage || "User has been signed out successfully!",
        });
      } catch (err) {
        reply.code(err?.statusCode || 400).send({
          success: false,
          message: err?.message || err,
        });
      }
    }
  );

  done();
};

export default usersRoutes;
