import LedgerPosting from "../../../models/ledger_posting";
import Orders from "../../../models/orders";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Create new GL posting
  fastify.post("/", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const {
          invoice_id,
          posting_type,
          account_code,
          debit_amount,
          credit_amount,
          description,
        } = request.body;
        const profile_id = request.token_profile_id;

        if (!invoice_id || !UUID_PATTERN.test(invoice_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid or missing invoice_id",
          });
        }

        if (!posting_type || !["REVENUE", "TAX", "COGS"].includes(posting_type)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid posting_type. Must be REVENUE, TAX, or COGS",
          });
        }

        if (!account_code) {
          return reply.code(400).send({
            statusCode: 400,
            message: "account_code is required",
          });
        }

        // Create posting
        const posting = await LedgerPosting.create({
          invoice_id,
          posting_reference: `GL-${invoice_id.substring(0, 8)}-${Date.now()}`,
          posting_type,
          account_code,
          debit_amount: debit_amount || 0,
          credit_amount: credit_amount || 0,
          description,
          posting_date: new Date(),
          status: "POSTED",
          posted_by: profile_id,
        });

        return reply.code(201).send({
          statusCode: 201,
          message: "GL posting created successfully",
          data: posting,
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({
          statusCode: 500,
          message: "Internal server error",
          error: err.message,
        });
      }
    },
  });
};
