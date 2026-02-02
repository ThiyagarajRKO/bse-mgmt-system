/**
 * Purchase Request Routes
 * Simple purchase request functionality for raw materials
 */

export default async (fastify) => {
  // Create purchase request
  fastify.post("/purchase-requests", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { species_id, required_quantity, production_order_id } =
          request.body;

        // For now, just log the purchase request
        // In a real implementation, this would create a purchase request record
        console.log("Purchase request created:", {
          species_id,
          required_quantity,
          production_order_id,
          requested_by: request.user?.id,
          requested_at: new Date(),
        });

        // TODO: Implement actual purchase request creation
        // This could involve:
        // 1. Creating a purchase_request record
        // 2. Notifying procurement team
        // 3. Updating production order status

        reply.send({
          statusCode: 200,
          message: "Purchase request submitted successfully",
          data: {
            species_id,
            required_quantity,
            production_order_id,
            status: "PENDING",
          },
        });
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({
          statusCode: 500,
          message: "Error creating purchase request",
          error: error.message,
        });
      }
    },
  });
};
