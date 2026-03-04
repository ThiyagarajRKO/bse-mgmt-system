import createRoute from "./create";
import getAllRoute from "./getAll";
import getRoute from "./get";
import updateRoute from "./update";

export default async (fastify) => {
  // Register all CRUD routes for tax engine
  fastify.register(createRoute);
  fastify.register(getAllRoute);
  fastify.register(getRoute);
  fastify.register(updateRoute);
};
