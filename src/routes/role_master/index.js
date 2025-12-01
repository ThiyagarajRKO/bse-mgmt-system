import { GetAll } from "./handlers/get_all";

// Schema
import { getAllSchema } from "./schema/get_all";

export const roleMasterRoute = (fastify, opts, done) => {
  fastify.get("/", getAllSchema, async (req, reply) => {
    try {
      let result = await GetAll(
        { profile_id: req?.token_profile_id },
        req?.session,
        fastify
      );

      // Normalize the response so callers (frontend) get a simple array when
      // appropriate. GetAll currently returns { data: { rows, count } } so
      // we prefer to expose the rows array directly under `data` for ease of use
      // in select/dropdown consumers.
      const payloadData =
        result?.data?.rows ?? // prefer rows array
        result?.data ?? // fallback to whatever GetAll returned
        result;

      return reply.code(result.statusCode || 200).send({
        success: true,
        data: payloadData,
      });;
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });;
    }
      });;

  done();
};

export default roleMasterRoute;
