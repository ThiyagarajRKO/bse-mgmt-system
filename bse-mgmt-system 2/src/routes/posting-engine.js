import PostingEngineService from "../services/PostingEngineService.js";
import { v4 as uuidv4 } from "uuid";

const postingEngineRoutes = async (fastify, opts) => {
  const postingService = new PostingEngineService();

  // Posting Rules CRUD operations
  fastify.get(
    "/posting-rules",
    {
      schema: {
        description: "Get all posting rules",
        tags: ["Posting Engine"],
        querystring: {
          type: "object",
          properties: {
            event_code: { type: "string" },
            module: { type: "string" },
            is_active: { type: "boolean" },
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "array",
                items: { $ref: "#PostingRule" },
              },
              pagination: {
                type: "object",
                properties: {
                  page: { type: "integer" },
                  limit: { type: "integer" },
                  total: { type: "integer" },
                  pages: { type: "integer" },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const {
          event_code,
          module,
          is_active,
          page = 1,
          limit = 20,
        } = request.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (event_code) whereClause.event_code = event_code;
        if (module) whereClause.module = module;
        if (is_active !== undefined) whereClause.is_active = is_active;

        const { PostingRuleMaster } = fastify.models;
        const { rows: rules, count: total } =
          await PostingRuleMaster.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [
              ["priority", "ASC"],
              ["created_at", "ASC"],
            ],
          });

        const totalPages = Math.ceil(total / limit);

        return {
          success: true,
          data: rules,
          pagination: {
            page,
            limit,
            total,
            pages: totalPages,
          },
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          message: "Failed to fetch posting rules",
          error: error.message,
        });
      }
    }
  );

  fastify.get(
    "/posting-rules/:id",
    {
      schema: {
        description: "Get posting rule by ID",
        tags: ["Posting Engine"],
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
          },
          required: ["id"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { $ref: "#PostingRule" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { PostingRuleMaster } = fastify.models;

        const rule = await PostingRuleMaster.findByPk(id);
        if (!rule) {
          return reply.code(404).send({
            success: false,
            message: "Posting rule not found",
          });
        }

        return {
          success: true,
          data: rule,
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          message: "Failed to fetch posting rule",
          error: error.message,
        });
      }
    }
  );

  fastify.post(
    "/posting-rules",
    {
      schema: {
        description: "Create new posting rule",
        tags: ["Posting Engine"],
        body: {
          type: "object",
          properties: {
            rule_code: { type: "string", maxLength: 30 },
            rule_name: { type: "string", maxLength: 100 },
            event_code: { type: "string", maxLength: 30 },
            module: {
              type: "string",
              enum: [
                "INVENTORY",
                "SALES",
                "PURCHASE",
                "PRODUCTION",
                "GST",
                "YIELD",
                "MANUAL",
              ],
            },
            description: { type: "string" },
            conditions: { type: "object" },
            debit_account_mappings: {
              type: "array",
              items: { type: "object" },
            },
            credit_account_mappings: {
              type: "array",
              items: { type: "object" },
            },
            posting_logic: { type: "object" },
            priority: { type: "integer", default: 100 },
            effective_from: { type: "string", format: "date" },
            effective_to: { type: "string", format: "date" },
          },
          required: [
            "rule_code",
            "rule_name",
            "event_code",
            "module",
            "debit_account_mappings",
            "credit_account_mappings",
          ],
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { $ref: "#PostingRule" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const ruleData = request.body;
        const { PostingRuleMaster } = fastify.models;

        // Check if rule_code already exists
        const existingRule = await PostingRuleMaster.findOne({
          where: { rule_code: ruleData.rule_code },
        });

        if (existingRule) {
          return reply.code(400).send({
            success: false,
            message: "Rule code already exists",
          });
        }

        const rule = await PostingRuleMaster.create({
          ...ruleData,
          id: uuidv4(),
          created_by: request.user?.id,
          updated_by: request.user?.id,
        });

        return reply.code(201).send({
          success: true,
          data: rule,
          message: "Posting rule created successfully",
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          message: "Failed to create posting rule",
          error: error.message,
        });
      }
    }
  );

  fastify.put(
    "/posting-rules/:id",
    {
      schema: {
        description: "Update posting rule",
        tags: ["Posting Engine"],
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            rule_name: { type: "string", maxLength: 100 },
            description: { type: "string" },
            conditions: { type: "object" },
            debit_account_mappings: {
              type: "array",
              items: { type: "object" },
            },
            credit_account_mappings: {
              type: "array",
              items: { type: "object" },
            },
            posting_logic: { type: "object" },
            priority: { type: "integer" },
            is_active: { type: "boolean" },
            effective_from: { type: "string", format: "date" },
            effective_to: { type: "string", format: "date" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { $ref: "#PostingRule" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const updateData = request.body;
        const { PostingRuleMaster } = fastify.models;

        const rule = await PostingRuleMaster.findByPk(id);
        if (!rule) {
          return reply.code(404).send({
            success: false,
            message: "Posting rule not found",
          });
        }

        await rule.update({
          ...updateData,
          updated_by: request.user?.id,
        });

        return {
          success: true,
          data: rule,
          message: "Posting rule updated successfully",
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          message: "Failed to update posting rule",
          error: error.message,
        });
      }
    }
  );

  fastify.delete(
    "/posting-rules/:id",
    {
      schema: {
        description: "Delete posting rule",
        tags: ["Posting Engine"],
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
          },
          required: ["id"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { PostingRuleMaster } = fastify.models;

        const rule = await PostingRuleMaster.findByPk(id);
        if (!rule) {
          return reply.code(404).send({
            success: false,
            message: "Posting rule not found",
          });
        }

        await rule.destroy();

        return {
          success: true,
          message: "Posting rule deleted successfully",
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          message: "Failed to delete posting rule",
          error: error.message,
        });
      }
    }
  );

  // Process posting event
  fastify.post(
    "/posting/process-event",
    {
      schema: {
        description: "Process a posting event and create journal entries",
        tags: ["Posting Engine"],
        body: {
          type: "object",
          properties: {
            eventCode: { type: "string" },
            module: {
              type: "string",
              enum: [
                "INVENTORY",
                "SALES",
                "PURCHASE",
                "PRODUCTION",
                "GST",
                "YIELD",
                "MANUAL",
              ],
            },
            documentType: { type: "string" },
            documentId: { type: "string", format: "uuid" },
            documentNo: { type: "string" },
            conditions: { type: "object" },
            amount: { type: "number" },
            baseAmount: { type: "number" },
            customerId: { type: "string", format: "uuid" },
            customerCode: { type: "string" },
            customerName: { type: "string" },
            supplierId: { type: "string", format: "uuid" },
            supplierCode: { type: "string" },
            supplierName: { type: "string" },
            speciesId: { type: "string", format: "uuid" },
            gstRate: { type: "number" },
            additionalData: { type: "object" },
          },
          required: ["eventCode", "module"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              journalEntries: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    journalNo: { type: "string" },
                    totalDebit: { type: "number" },
                    totalCredit: { type: "number" },
                    lines: { type: "integer" },
                  },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const eventData = request.body;
        const context = {
          userId: request.user?.id,
          userName: request.user?.name,
          ipAddress: request.ip,
          sessionId: request.session?.id,
        };

        const result = await postingService.processEvent(eventData, context);

        return reply.code(200).send(result);
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          message: "Failed to process posting event",
          error: error.message,
        });
      }
    }
  );

  // Journal entries endpoints
  fastify.get(
    "/journals",
    {
      schema: {
        description: "Get journal entries",
        tags: ["Posting Engine"],
        querystring: {
          type: "object",
          properties: {
            journal_no: { type: "string" },
            source_module: { type: "string" },
            event_code: { type: "string" },
            status: {
              type: "string",
              enum: ["DRAFT", "POSTED", "REVERSED", "ERROR"],
            },
            start_date: { type: "string", format: "date" },
            end_date: { type: "string", format: "date" },
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "array",
                items: { $ref: "#JournalHeader" },
              },
              pagination: {
                type: "object",
                properties: {
                  page: { type: "integer" },
                  limit: { type: "integer" },
                  total: { type: "integer" },
                  pages: { type: "integer" },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const {
          journal_no,
          source_module,
          event_code,
          status,
          start_date,
          end_date,
          page = 1,
          limit = 20,
        } = request.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (journal_no)
          whereClause.journal_no = {
            [fastify.models.Sequelize.Op.iLike]: `%${journal_no}%`,
          };
        if (source_module) whereClause.source_module = source_module;
        if (event_code) whereClause.event_code = event_code;
        if (status) whereClause.status = status;

        if (start_date || end_date) {
          whereClause.journal_date = {};
          if (start_date)
            whereClause.journal_date[fastify.models.Sequelize.Op.gte] =
              start_date;
          if (end_date)
            whereClause.journal_date[fastify.models.Sequelize.Op.lte] =
              end_date;
        }

        const { JournalHeader } = fastify.models;
        const { rows: journals, count: total } =
          await JournalHeader.findAndCountAll({
            where: whereClause,
            include: [
              {
                model: fastify.models.JournalLines,
                as: "journalLines",
                required: false,
              },
            ],
            limit,
            offset,
            order: [
              ["journal_date", "DESC"],
              ["created_at", "DESC"],
            ],
          });

        const totalPages = Math.ceil(total / limit);

        return {
          success: true,
          data: journals,
          pagination: {
            page,
            limit,
            total,
            pages: totalPages,
          },
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          message: "Failed to fetch journal entries",
          error: error.message,
        });
      }
    }
  );

  fastify.get(
    "/journals/:id",
    {
      schema: {
        description: "Get journal entry by ID with lines",
        tags: ["Posting Engine"],
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
          },
          required: ["id"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  header: { $ref: "#JournalHeader" },
                  lines: {
                    type: "array",
                    items: { $ref: "#JournalLine" },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { JournalHeader, JournalLines } = fastify.models;

        const journal = await JournalHeader.findByPk(id, {
          include: [
            {
              model: JournalLines,
              as: "journalLines",
              required: false,
              order: [["line_no", "ASC"]],
            },
          ],
        });

        if (!journal) {
          return reply.code(404).send({
            success: false,
            message: "Journal entry not found",
          });
        }

        return {
          success: true,
          data: {
            header: journal,
            lines: journal.journalLines || [],
          },
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          message: "Failed to fetch journal entry",
          error: error.message,
        });
      }
    }
  );

  fastify.post(
    "/journals/:id/reverse",
    {
      schema: {
        description: "Reverse a journal entry",
        tags: ["Posting Engine"],
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            reason: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              originalJournal: { type: "string" },
              reversalJournal: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { reason } = request.body;
        const context = {
          userId: request.user?.id,
          userName: request.user?.name,
          ipAddress: request.ip,
          sessionId: request.session?.id,
          reason,
        };

        const result = await postingService.reverseJournal(id, context);

        return {
          success: true,
          ...result,
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          message: "Failed to reverse journal entry",
          error: error.message,
        });
      }
    }
  );

  // Audit log endpoints
  fastify.get(
    "/posting-audit",
    {
      schema: {
        description: "Get posting audit logs",
        tags: ["Posting Engine"],
        querystring: {
          type: "object",
          properties: {
            event_code: { type: "string" },
            action: { type: "string" },
            status: { type: "string", enum: ["SUCCESS", "FAILURE", "WARNING"] },
            start_date: { type: "string", format: "date" },
            end_date: { type: "string", format: "date" },
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "array",
                items: { $ref: "#PostingAuditLog" },
              },
              pagination: {
                type: "object",
                properties: {
                  page: { type: "integer" },
                  limit: { type: "integer" },
                  total: { type: "integer" },
                  pages: { type: "integer" },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const {
          event_code,
          action,
          status,
          start_date,
          end_date,
          page = 1,
          limit = 20,
        } = request.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (event_code) whereClause.event_code = event_code;
        if (action) whereClause.action = action;
        if (status) whereClause.status = status;

        if (start_date || end_date) {
          whereClause.created_at = {};
          if (start_date)
            whereClause.created_at[fastify.models.Sequelize.Op.gte] =
              start_date;
          if (end_date)
            whereClause.created_at[fastify.models.Sequelize.Op.lte] = end_date;
        }

        const { PostingAuditLog } = fastify.models;
        const { rows: auditLogs, count: total } =
          await PostingAuditLog.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [["created_at", "DESC"]],
          });

        const totalPages = Math.ceil(total / limit);

        return {
          success: true,
          data: auditLogs,
          pagination: {
            page,
            limit,
            total,
            pages: totalPages,
          },
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          message: "Failed to fetch audit logs",
          error: error.message,
        });
      }
    }
  );
};

export default postingEngineRoutes;
