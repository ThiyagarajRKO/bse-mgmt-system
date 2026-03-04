import TaxCode from "../../../models/tax_code_master";
import PackagingMaster from "../../../models/packaging_master";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Create new tax code mapping
  fastify.post("/", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { product_id, tax_rate, supply_type, is_export_zero_rated } = request.body;
        const profile_id = request.token_profile_id;

        if (!product_id || !UUID_PATTERN.test(product_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid or missing product_id",
          });
        }

        if (!tax_rate && !is_export_zero_rated) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Either tax_rate or is_export_zero_rated must be provided",
          });
        }

        // Create tax code
        const taxCode = await TaxCode.create({
          product_id,
          tax_rate: tax_rate || 0,
          supply_type: supply_type || "DOMESTIC",
          is_export_zero_rated: is_export_zero_rated || false,
          created_by: profile_id,
        });

        return reply.code(201).send({
          statusCode: 201,
          message: "Tax code created successfully",
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
