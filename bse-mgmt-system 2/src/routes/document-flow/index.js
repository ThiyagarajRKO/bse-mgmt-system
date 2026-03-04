import { packingListRoutes } from "./packing-list.js";
import { invoiceRoutes } from "./invoice.js";

export const documentFlowRoutes = (fastify, opts, done) => {
  // Register packing list routes under /api/packing-list
  fastify.register(packingListRoutes, { prefix: "/packing-list" });

  // Register invoice routes under /api/invoice
  fastify.register(invoiceRoutes, { prefix: "/invoice" });

  done();
};
