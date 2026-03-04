import * as PackingController from "../../../controllers/packing.js";

export default async function aiContainersHandler(fastify, opts) {
  /**
   * POST /packing/ai-containers
   * Get AI-recommended packing containers based on product and quantity
   */
  fastify.post("/ai-containers", async (request, reply) => {
    try {
      const { product_id, quantity_kg, market, grade, size, product_category } =
        request.body;

      const result = await PackingController.RecommendPackingContainers({
        product_id,
        quantity_kg,
        market,
        grade,
        size,
        product_category,
      });

      return reply.code(200).send({
        statusCode: 200,
        message: "AI packing recommendations generated successfully",
        data: result,
      });
    } catch (err) {
      console.error("Error in AI containers handler:", err);
      return reply.code(err.statusCode || 500).send({
        statusCode: err.statusCode || 500,
        message: err.message || "Error generating AI recommendations",
      });
    }
  });

  /**
   * GET /packing/ai-containers/test
   * Test endpoint for AI packing logic
   */
  fastify.get("/ai-containers/test", async (request, reply) => {
    try {
      // Test data
      const testResult = await PackingController.RecommendPackingContainers({
        product_id: 1,
        quantity_kg: 500,
        market: "EXPORT",
        grade: "PREMIUM",
        size: "MEDIUM",
        product_category: "SEAFOOD",
      });

      return reply.code(200).send({
        statusCode: 200,
        message: "AI packing test executed successfully",
        data: testResult,
      });
    } catch (err) {
      console.error("Error in test endpoint:", err);
      return reply.code(err.statusCode || 500).send({
        statusCode: err.statusCode || 500,
        message: err.message || "Error in test",
      });
    }
  });
}
