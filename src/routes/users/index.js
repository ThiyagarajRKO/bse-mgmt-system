import { SignIn } from "./handlers/signin";
import { SignUp } from "./handlers/signup";
import { SignOut } from "./handlers/signout";
import { ValidateUser } from "../../middlewares/authentication";

// Schema
import { signUpSchema } from "./schema/signup";
import { signInSchema } from "./schema/signin";

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

  fastify.post("/signup", signUpSchema, async (req, reply) => {
    try {
      let result = await SignUp(req.body, fastify);
      reply.code(200).send({
        success: true,
        message: result?.message || "Account has been created successfully!",
        data: result?.data,
      });
    } catch (err) {
      reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.response?.data?.Details || err?.message || err,
      });
    }
  });

  fastify.get(
    "/signout",
    {
      preHandler: [ValidateUser],
    },
    async (req, reply) => {
      try {
        let result = await SignOut(
          { profile_id: req?.token_profile_id },
          req?.session,
          fastify
        );

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

  fastify.get(
    "/ping",
    {
      preHandler: [ValidateUser],
    },
    async (req, reply) => {
      try {
        reply.code(200).send({
          success: true,
          message: "pong",
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
