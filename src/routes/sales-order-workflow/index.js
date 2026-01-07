import createRoute from "./create";
import getAllRoute from "./getAll";
import getRoute from "./get";
import updateRoute from "./update";
import actionsRoute from "./actions";

export default async (fastify) => {
  // Register all CRUD routes
  fastify.register(createRoute, { prefix: "/create" });
  fastify.register(getAllRoute);
  fastify.register(getRoute);
  fastify.register(updateRoute);
  fastify.register(actionsRoute);
};
