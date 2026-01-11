import purchaseInventoryRoute from "./purchase";
import salesInventoryRoute from "./sales";
import stockRoute from "./stock";

export const inventoryRoute = (fastify, opts, done) => {
  fastify.register(purchaseInventoryRoute, {
    prefix: "/purchase",
  });

  fastify.register(salesInventoryRoute, {
    prefix: "/sales",
  });

  fastify.register(stockRoute, {
    prefix: "/stock",
  });

  done();
};

export default inventoryRoute;
