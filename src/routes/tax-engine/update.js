import TaxCode from "../../../models/tax_code_master";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Update tax code
  fastify.put("/:tax_code_id", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { tax_code_id } = request.params;
        const { tax_rate, supply_type, is_export_zero_rated } = request.body;
        const profile_id = request.token_profile_id;

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

        const updates = { updated_by: profile_id };

        // Update tax rate if provided
        if (tax_rate !== undefined && tax_rate >= 0) {
          updates.tax_rate = tax_rate;
        }

        // Update supply type if provided
        if (supply_type && ["DOMESTIC", "EXPORT", "REVERSE_CHARGE"].includes(supply_type)) {
          updates.supply_type = supply_type;
        }

        // Update export zero rated if provided
        if (is_export_zero_rated !== undefined) {
          updates.is_export_zero_rated = is_export_zero_rated;
        }

        await taxCode.update(updates);

        return reply.code(200).send({
          statusCode: 200,
          message: "Tax code updated successfully",
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
