import LedgerPosting from "../../../models/ledger_posting";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Update GL posting
  fastify.put("/:posting_id", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { posting_id } = request.params;
        const { account_code, debit_amount, credit_amount, description } = request.body;
        const profile_id = request.token_profile_id;

        if (!UUID_PATTERN.test(posting_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid posting_id format",
          });
        }

        const posting = await LedgerPosting.findByPk(posting_id);
        if (!posting) {
          return reply.code(404).send({
            statusCode: 404,
            message: "Posting not found",
          });
        }

        // Only allow updates for postings not yet reconciled
        if (posting.status === "RECONCILED") {
          return reply.code(400).send({
            statusCode: 400,
            message: "Cannot update reconciled postings",
          });
        }

        const updates = { updated_by: profile_id };

        // Update fields if provided
        if (account_code) updates.account_code = account_code;
        if (debit_amount !== undefined) updates.debit_amount = debit_amount;
        if (credit_amount !== undefined) updates.credit_amount = credit_amount;
        if (description) updates.description = description;

        await posting.update(updates);

        return reply.code(200).send({
          statusCode: 200,
          message: "Posting updated successfully",
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
