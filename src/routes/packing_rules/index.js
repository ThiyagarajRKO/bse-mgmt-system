import { GetSuggestions, Validate, GetMappings } from "./handlers";

export const packingRulesRoute = (fastify, opts, done) => {
  /**
   * GET /packing/rules/suggestions
   * Auto-suggest packaging based on product_id and market (grade/size from product)
   */
  fastify.get("/suggestions", async (req, reply) => {
    try {
      const params = { ...req.query };
      const result = await GetSuggestions(params, req?.session, fastify);

      return reply.code(result.statusCode || 200).send({
        success: true,
        data: result.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  /**
   * POST /packing/rules/validate
   * Validate packing selection
   */
  fastify.post("/validate", async (req, reply) => {
    try {
      const params = { ...req.body };
      const result = await Validate(params, req?.session, fastify);

      return reply.code(result.statusCode || 200).send({
        success: true,
        data: result.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  /**
   * GET /packing/rules/mappings
   * Get all product-packaging mappings
   */
  fastify.get("/mappings", async (req, reply) => {
    try {
      const params = { ...req.query };
      const result = await GetMappings(params, req?.session, fastify);

      return reply.code(result.statusCode || 200).send({
        success: true,
        data: result,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  done();
};

export default packingRulesRoute;
