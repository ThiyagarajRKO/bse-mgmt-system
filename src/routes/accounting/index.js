import { Create, Post, Reverse, Get, GetAll } from "./handlers";
import {
  createSchema,
  postSchema,
  reverseSchema,
  getSchema,
  getAllSchema,
} from "./schema";
import TemplateController from "../../controllers/accounting/template.js";

export const AccountingRoute = (fastify, opts, done) => {
  // Create Journal Entry
  fastify.post("/journal-entries", createSchema, async (req, reply) => {
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

  // Post Journal Entry
  fastify.post(
    "/journal-entries/:journal_entry_id/post",
    postSchema,
    async (req, reply) => {
      try {
        const params = { profile_id: req?.token_profile_id, ...req.params };
        const result = await Post(params, req?.session, fastify);
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
    },
  );

  // Reverse Journal Entry
  fastify.post(
    "/journal-entries/:journal_entry_id/reverse",
    reverseSchema,
    async (req, reply) => {
      try {
        const params = {
          profile_id: req?.token_profile_id,
          ...req.body,
          ...req.params,
        };
        const result = await Reverse(params, req?.session, fastify);
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
    },
  );

  // Get Journal Entry
  fastify.get(
    "/journal-entries/:journal_entry_id",
    getSchema,
    async (req, reply) => {
      try {
        const params = { ...req.params };
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
    },
  );

  // Get All Journal Entries
  fastify.get("/journal-entries", getAllSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };
      const result = await GetAll(params, req?.session, fastify);
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

  // Journal Template Routes
  // Get all journal templates
  fastify.get("/journal-templates", async (req, reply) => {
    return TemplateController.GetAllJournalTemplates(req, reply);
  });

  // Get journal template by event type
  fastify.get("/journal-templates/:event_type", async (req, reply) => {
    return TemplateController.GetJournalTemplateByEvent(req, reply);
  });

  // Save/Create journal template
  fastify.post("/journal-templates", async (req, reply) => {
    return TemplateController.SaveJournalTemplate(req, reply);
  });

  // Apply journal template (creates journal entry from template)
  fastify.post("/journal-templates/apply", async (req, reply) => {
    return TemplateController.ApplyJournalTemplate(req, reply);
  });

  // Get journal mapping matrix (formatted for display)
  fastify.get("/journal-mapping-matrix", async (req, reply) => {
    return TemplateController.GetJournalMappingMatrix(req, reply);
  });

  done();
};
