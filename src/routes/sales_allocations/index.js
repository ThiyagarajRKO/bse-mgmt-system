"use strict";

const SalesAllocationController = require("../../controllers/SalesAllocationController");

async function salesAllocationRoutes(fastify) {
  // Create allocation
  fastify.post("/sales/allocations", async (request, reply) => {
    return SalesAllocationController.allocateOrderLine(request, reply);
  });

  // List allocations
  fastify.get("/sales/allocations", async (request, reply) => {
    return SalesAllocationController.listAllocations(request, reply);
  });

  // Get allocation details
  fastify.get("/sales/allocations/:id", async (request, reply) => {
    return SalesAllocationController.getAllocationDetails(request, reply);
  });

  // Confirm allocation
  fastify.put("/sales/allocations/:id/confirm", async (request, reply) => {
    return SalesAllocationController.confirmAllocation(request, reply);
  });

  // Update fulfillment
  fastify.put("/sales/allocations/:id/fulfill", async (request, reply) => {
    return SalesAllocationController.updateFulfillment(request, reply);
  });

  // Complete allocation
  fastify.put("/sales/allocations/:id/complete", async (request, reply) => {
    return SalesAllocationController.completeAllocation(request, reply);
  });

  // Cancel allocation
  fastify.put("/sales/allocations/:id/cancel", async (request, reply) => {
    return SalesAllocationController.cancelAllocation(request, reply);
  });

  // Create demands from allocation
  fastify.post(
    "/sales/allocations/:id/create-demands",
    async (request, reply) => {
      return SalesAllocationController.createDemandsFromAllocation(
        request,
        reply
      );
    }
  );

  // Get order allocation summary
  fastify.get(
    "/sales/orders/:orderId/allocation-summary",
    async (request, reply) => {
      return SalesAllocationController.getOrderAllocationSummary(
        request,
        reply
      );
    }
  );
}

module.exports = salesAllocationRoutes;
