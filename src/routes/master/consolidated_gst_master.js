import {
  Insert,
  Update,
  Get,
  GetAll,
  Delete,
} from "../../controllers/consolidated_gst_master.js";

export const consolidatedGstMasterRoute = (fastify, opts, done) => {
  // CREATE CONSOLIDATED GST MASTER
  fastify.post("/create", async (req, reply) => {
    try {
      const profile_id = req?.token_profile_id;
      const result = await Insert(profile_id, req.body);
      return reply.code(201).send(result);
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ message: err.message });
    }
  });

  // UPDATE CONSOLIDATED GST MASTER
  fastify.put("/update/:id", async (req, reply) => {
    try {
      const profile_id = req?.token_profile_id;
      const result = await Update(profile_id, req.params.id, req.body);
      return reply.code(200).send(result);
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ message: err.message });
    }
  });

  // GET CONSOLIDATED GST MASTER BY ID
  fastify.get("/get/:id", async (req, reply) => {
    try {
      const result = await Get(req.params.id);
      return reply.code(200).send(result);
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ message: err.message });
    }
  });

  // GET ALL CONSOLIDATED GST MASTERS (DATATABLES)
  fastify.get("/", async (req, reply) => {
    try {
      const result = await GetAll(req.query);
      const response = {
        draw: Number(req.query.draw || 1),
        recordsTotal: result.recordsTotal || 0,
        recordsFiltered: result.recordsFiltered || 0,
        data: result.rows || [],
      };
      return reply.code(200).send(response);
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ message: err.message });
    }
  });

  // DELETE CONSOLIDATED GST MASTER
  fastify.delete("/delete/:id", async (req, reply) => {
    try {
      const profile_id = req?.token_profile_id;
      const result = await Delete(profile_id, req.params.id);
      return reply.code(200).send(result);
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ message: err.message });
    }
  });

  // LIST FOR DROPDOWN
  fastify.get("/list", async (req, reply) => {
    try {
      const result = await GetAll({ ...req.query, length: 1000 }); // Large limit for dropdown
      return reply.code(200).send({ data: result.rows });
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ message: err.message });
    }
  });

  done();
};
