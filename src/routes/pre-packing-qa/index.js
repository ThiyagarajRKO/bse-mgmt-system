import createRoute from "./create";
import getAllRoute from "./getAll";

export default async (fastify) => {
  // Register all CRUD routes for pre-packing QA
  fastify.register(createRoute);
  fastify.register(getAllRoute);
};