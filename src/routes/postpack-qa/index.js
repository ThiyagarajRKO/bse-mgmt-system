import * as PostPackQAController from "../../controllers/postpack_qa.js";

export default async (fastify) => {
  // Create new Post-Pack QA inspection
  fastify.post(
    "/create",
    {
      schema: {
        tags: ["Post-Pack QA"],
        summary: "Create post-pack QA inspection",
        description:
          "Create a new post-pack QA (final product QA) inspection record",
        body: {
          type: "object",
          properties: {
            packing_id: { type: "string", description: "Packing record ID" },
            order_id: { type: "string", description: "Order ID" },
            batch_id: { type: "string", description: "Batch/Lot ID" },
            sample_size: {
              type: "integer",
              description: "Number of samples inspected",
            },
            seal_integrity: { type: "boolean" },
            vacuum_proper: { type: "boolean" },
            tray_damage: { type: "boolean" },
            carton_condition: { type: "boolean" },
            ice_buildup_acceptable: { type: "boolean" },
            label_correct: { type: "boolean" },
            net_weight_avg: { type: "number" },
            net_weight_compliant: { type: "boolean" },
            glazing_pct: { type: "number" },
            glazing_compliant: { type: "boolean" },
            product_appearance_pass: { type: "boolean" },
            foreign_matter_found: { type: "boolean" },
            temperature_core: { type: "number" },
            temperature_compliant: { type: "boolean" },
            carton_weight_expected: { type: "number" },
            carton_weight_actual: { type: "number" },
            carton_weight_compliant: { type: "boolean" },
            traceability_verified: { type: "boolean" },
            qa_status: { type: "string", enum: ["PASS", "HOLD", "FAIL"] },
            qa_decision_remarks: { type: "string" },
          },
          required: ["packing_id", "qa_status"],
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await PostPackQAController.createPostPackQA(
          request.session.pid,
          request.body,
        );
        return reply.code(result.status ? 200 : 400).send(result);
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          status: false,
          message: "Internal server error",
        });
      }
    },
  );

  // Get Post-Pack QA by packing ID
  fastify.get(
    "/by-packing/:packing_id",
    {
      schema: {
        tags: ["Post-Pack QA"],
        summary: "Get post-pack QA by packing ID",
        params: {
          type: "object",
          properties: {
            packing_id: { type: "string" },
          },
          required: ["packing_id"],
        },
      },
    },
    async (request, reply) => {
      try {
        const qa = await PostPackQAController.getPostPackQAByPackingId(
          request.params.packing_id,
        );
        return reply.send({
          status: !!qa,
          data: qa,
          message: qa ? "Post-Pack QA found" : "No QA inspection found",
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          status: false,
          message: "Internal server error",
        });
      }
    },
  );

  // Update Post-Pack QA inspection
  fastify.put(
    "/:qa_id",
    {
      schema: {
        tags: ["Post-Pack QA"],
        summary: "Update post-pack QA inspection",
        params: {
          type: "object",
          properties: {
            qa_id: { type: "string" },
          },
          required: ["qa_id"],
        },
        body: {
          type: "object",
          properties: {
            qa_status: { type: "string", enum: ["PASS", "HOLD", "FAIL"] },
            qa_decision_remarks: { type: "string" },
            follow_up_action: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await PostPackQAController.updatePostPackQA(
          request.session.pid,
          request.params.qa_id,
          request.body,
        );
        return reply.code(result.status ? 200 : 400).send(result);
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          status: false,
          message: "Internal server error",
        });
      }
    },
  );

  // Get QA decision summary for a packing
  fastify.get(
    "/decision/:packing_id",
    {
      schema: {
        tags: ["Post-Pack QA"],
        summary: "Get QA decision summary",
        params: {
          type: "object",
          properties: {
            packing_id: { type: "string" },
          },
          required: ["packing_id"],
        },
      },
    },
    async (request, reply) => {
      try {
        const summary = await PostPackQAController.getQADecisionSummary(
          request.params.packing_id,
        );
        return reply.send({
          status: !!summary,
          data: summary,
          message: summary ? "QA summary found" : "No QA decision available",
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          status: false,
          message: "Internal server error",
        });
      }
    },
  );

  // Get QA statistics for date range
  fastify.get(
    "/statistics",
    {
      schema: {
        tags: ["Post-Pack QA"],
        summary: "Get QA statistics",
        querystring: {
          type: "object",
          properties: {
            start_date: { type: "string", format: "date-time" },
            end_date: { type: "string", format: "date-time" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { start_date, end_date } = request.query;
        const startDate = start_date
          ? new Date(start_date)
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = end_date ? new Date(end_date) : new Date();

        const stats = await PostPackQAController.getQAStatistics(
          startDate,
          endDate,
        );
        return reply.send({
          status: true,
          data: stats,
          message: "QA statistics retrieved",
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          status: false,
          message: "Internal server error",
        });
      }
    },
  );

  // List all Post-Pack QA inspections (for DataTable)
  fastify.get(
    "/list",
    {
      schema: {
        tags: ["Post-Pack QA"],
        summary: "List all post-pack QA inspections",
        querystring: {
          type: "object",
          properties: {
            start: { type: "integer", default: 0 },
            length: { type: "integer", default: 10 },
            draw: { type: "integer" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const start = parseInt(request.query.start) || 0;
        const length = parseInt(request.query.length) || 10;
        const draw = request.query.draw || 1;

        const result = await PostPackQAController.listPostPackQA(start, length);

        // Return in DataTable format
        return reply.send({
          draw: draw,
          recordsTotal: result.count,
          recordsFiltered: result.count,
          data: result.data,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          status: false,
          message: "Internal server error",
        });
      }
    },
  );

  // Get single Post-Pack QA inspection by ID
  fastify.get(
    "/:qa_id",
    {
      schema: {
        tags: ["Post-Pack QA"],
        summary: "Get post-pack QA inspection by ID",
        params: {
          type: "object",
          properties: {
            qa_id: { type: "string" },
          },
          required: ["qa_id"],
        },
      },
    },
    async (request, reply) => {
      try {
        const qa = await PostPackQAController.getPostPackQAById(
          request.params.qa_id,
        );

        if (!qa) {
          return reply.code(404).send({
            status: false,
            message: "Post-pack QA inspection not found",
          });
        }

        return reply.send({
          status: true,
          data: qa,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          status: false,
          message: "Internal server error",
        });
      }
    },
  );
};
