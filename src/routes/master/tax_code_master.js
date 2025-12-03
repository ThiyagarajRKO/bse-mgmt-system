import {
  Insert,
  Update,
  Get,
  GetAll,
  Delete,
} from "../../controllers/tax_code_master.js";

export const taxCodeMasterRoute = (fastify, opts, done) => {
  // CREATE TAX CODE MASTER
  fastify.post("/create", async (req, reply) => {
    try {
      const profile_id = req?.token_profile_id;
      const result = await Insert(profile_id, req.body);
      return reply.code(201).send(result);
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ message: err.message });
    }
  });

  // UPDATE TAX CODE MASTER
  fastify.put("/update/:id", async (req, reply) => {
    try {
      const profile_id = req?.token_profile_id;
      const result = await Update(profile_id, req.params.id, req.body);
      return reply.code(200).send(result);
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ message: err.message });
    }
  });

  // GET TAX CODE MASTER BY ID
  fastify.get("/get/:id", async (req, reply) => {
    try {
      const result = await Get(req.params.id);
      return reply.code(200).send(result);
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ message: err.message });
    }
  });

  // GET ALL TAX CODE MASTER (DATATABLES)
  fastify.get("/", async (req, reply) => {
    try {
      const result = await GetAll(req.query);
      return reply.code(200).send(result);
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ message: err.message });
    }
  });

  // DELETE TAX CODE MASTER
  fastify.delete("/delete/:id", async (req, reply) => {
    try {
      const profile_id = req?.token_profile_id;
      const result = await Delete(profile_id, req.params.id);
      return reply.code(200).send(result);
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ message: err.message });
    }
  });

  done();
};
