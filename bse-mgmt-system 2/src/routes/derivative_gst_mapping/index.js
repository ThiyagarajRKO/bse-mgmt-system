// routes/derivative_gst_mapping/index.js
import { Create } from "./handlers/create.js";
import { GetBySpecies } from "./handlers/get_by_species.js";
import { GetForProduct } from "./handlers/get_for_product.js";

// Schemas
import { createSchema } from "./schema/create.js";
import { getBySpeciesSchema } from "./schema/get_by_species.js";
import { getForProductSchema } from "./schema/get_for_product.js";

export const DerivativeGstMappingRoute = (fastify, opts, done) => {
  // POST /derivative-gst-mapping - Create new mapping
  fastify.post("/", createSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.body };
      const result = await Create(params, req?.session, fastify);

      reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  // GET /derivative-gst-mapping/by-species/:species_master_id
  fastify.get(
    "/by-species/:species_master_id",
    getBySpeciesSchema,
    async (req, reply) => {
      try {
        const params = req.params;
        const result = await GetBySpecies(params, req?.session, fastify);

        reply.code(result.statusCode || 200).send({
          success: true,
          message: result.message,
          data: result?.data,
        });
      } catch (err) {
        reply.code(err?.statusCode || 400).send({
          success: false,
          message: err?.message || err,
        });
      }
    },
  );

  // GET /derivative-gst-mapping/for-product/:product_id
  fastify.get(
    "/for-product/:product_id",
    getForProductSchema,
    async (req, reply) => {
      try {
        const params = req.params;
        const result = await GetForProduct(params, req?.session, fastify);

        reply.code(result.statusCode || 200).send({
          success: true,
          message: result.message,
          data: result?.data,
        });
      } catch (err) {
        reply.code(err?.statusCode || 400).send({
          success: false,
          message: err?.message || err,
        });
      }
    },
  );

  done();
};

export default DerivativeGstMappingRoute;
