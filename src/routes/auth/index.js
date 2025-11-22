import { Ping } from "./handlers/ping";
import { ValidateUser } from "../../middlewares/authentication";

export const authRoutes = (fastify, opts, done) => {
  fastify.get("/ping", { preHandler: [ValidateUser] }, async (req, reply) => {
    try {
      const result = await Ping({}, req.session, fastify);
      return reply.code(200).send(result);
    } catch (err) {
      return reply.code(500).send({ success: false, message: err.message });
    }
  });

  done();
};

export default authRoutes;
