import workflowRoute from "./workflow";
import linkOrdersRoute from "./link_orders";

export default async (fastify) => {
  // Register workflow routes (Production orders with BOM operations, inventory)
  // Production.ejs page uses /api/dispatch and /api/peeling endpoints directly
  fastify.register(workflowRoute);

  // Register order linking routes (connect orders to production)
  fastify.register(linkOrdersRoute);
};
