import {
  Insert,
  Update,
  Get,
  GetAll,
  Delete,
} from "../../controllers/chart_of_accounts.js";

export const chartOfAccountsRoute = (fastify, opts, done) => {
  // CREATE CHART OF ACCOUNTS
  fastify.post("/create", async (req, reply) => {
    try {
      const profile_id = req?.token_profile_id;
      const result = await Insert(profile_id, req.body);
      return reply.code(201).send(result);
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ message: err.message });
    }
  });

  // UPDATE CHART OF ACCOUNTS
  fastify.put("/update/:id", async (req, reply) => {
    try {
      const profile_id = req?.token_profile_id;
      const result = await Update(profile_id, req.params.id, req.body);
      return reply.code(200).send(result);
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ message: err.message });
    }
  });

  // GET CHART OF ACCOUNTS BY ID
  fastify.get("/get/:id", async (req, reply) => {
    try {
      const result = await Get(req.params.id);
      return reply.code(200).send(result);
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ message: err.message });
    }
  });

  // GET ALL CHART OF ACCOUNTS (DATATABLES)
  fastify.get("/", async (req, reply) => {
    try {
      const result = await GetAll(req.query);
      return reply.code(200).send(result);
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ message: err.message });
    }
  });

  // DELETE CHART OF ACCOUNTS
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
