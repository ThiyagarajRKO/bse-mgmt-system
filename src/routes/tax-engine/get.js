import TaxCode from "../../../models/tax_code_master";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Get single tax code by ID
  fastify.get("/:tax_code_id", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { tax_code_id } = request.params;

        if (!UUID_PATTERN.test(tax_code_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid tax_code_id format",
          });
        }

        const taxCode = await TaxCode.findByPk(tax_code_id);

        if (!taxCode) {
          return reply.code(404).send({
            statusCode: 404,
            message: "Tax code not found",
          });
        }

        return reply.code(200).send({
          statusCode: 200,
          message: "Tax code fetched successfully",
          data: taxCode,
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
