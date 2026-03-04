import qaHandlers from "./handlers.js";

export default async (fastify) => {
  // Apply all QA handlers directly to the fastify instance
  // This allows proper route matching without plugin scope interference
  // Routes are registered in the order they appear in handlers.js
  await qaHandlers(fastify);
};
