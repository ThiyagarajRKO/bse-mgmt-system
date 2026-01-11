import createRoute from "./create";
import getAllRoute from "./getAll";
import getRoute from "./get";
import updateRoute from "./update";
import workflowRoute from "./workflow";

export default async (fastify) => {
  // Register all CRUD routes for production
  fastify.register(createRoute);
  fastify.register(getAllRoute);
  fastify.register(getRoute);
  fastify.register(updateRoute);

  // Register workflow routes (BOM operations, inventory)
  fastify.register(workflowRoute);
};
