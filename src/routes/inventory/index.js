import purchaseInventoryRoute from "./purchase";
import salesInventoryRoute from "./sales";

export const inventoryRoute = (fastify, opts, done) => {
  fastify.register(purchaseInventoryRoute, {
    prefix: "/purchase",
  });

  fastify.register(salesInventoryRoute, {
    prefix: "/sales",
  });

  done();
};

export default inventoryRoute;
