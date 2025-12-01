import { Create } from "./handlers/create";
import { Update } from "./handlers/update";
import { Get } from "./handlers/get";
import { GetAll } from "./handlers/get_all";
import { List } from "./handlers/list";
import { Delete } from "./handlers/delete";
import { ValidateUser } from "../../middlewares/authentication";

// Schema
import { createSchema } from "./schema/create";
import { updateSchema } from "./schema/update";
import { getSchema } from "./schema/get";
import { getAllSchema } from "./schema/get _all";
import { deleteSchema } from "./schema/delete";

export const locationMasterRoute = (fastify, opts, done) => {
  fastify.post("/", createSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.body };

      const result = await Create(params, req?.session, fastify);

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

  fastify.put("/", updateSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.body };

      const result = await Update(params, req?.session, fastify);

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

  fastify.get("/:location_master_id", getSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.params };

      const result = await Get(params, req?.session, fastify);

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

  fastify.get(
    "/",
    {
      preHandler: [ValidateUser],
      ...getAllSchema,
    },
    async (req, reply) => {
      try {
        const params = { profile_id: req?.token_profile_id, ...req.query };

        const result = await GetAll(params, req?.session, fastify);

        // The GetAll handler returns { data: { rows, count } } — send it directly as `data`
        // Ensure the result is serializable (callers observed missing payload when model instances were returned)
        let serializableData = result.data;
        try {
          serializableData = JSON.parse(JSON.stringify(result.data));
        } catch (e) {
          // fallback to original result
          serializableData = result.data;
        }

        return reply.code(200).send({
          draw: Number(req.query.draw || 1),
          recordsTotal: serializableData.count || 0,
          recordsFiltered: serializableData.count || 0,
          data: serializableData.rows || [],
        });
      } catch (err) {
        return reply.code(err?.statusCode || 400).send({
          success: false,
          message: err?.message || err,
        });
      }
    }
  );

  // simple list for dropdowns
  fastify.get("/list", async (req, reply) => {
    try {
      const result = await List(req?.query, req?.session, fastify);
      return reply.code(200).send(result);
    } catch (err) {
      return reply
        .code(err?.statusCode || 500)
        .send({ success: false, message: err?.message || err });
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

export default locationMasterRoute;
