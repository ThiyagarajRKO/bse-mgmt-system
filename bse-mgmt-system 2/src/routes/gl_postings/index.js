"use strict";

const GLPostingController = require("../../controllers/GLPostingController");

async function glPostingRoutes(fastify) {
  // Post production output to GL
  fastify.post("/gl/post/production-output/:id", async (request, reply) => {
    return GLPostingController.postProductionOutput(request, reply);
  });

  // Post sales invoice to GL
  fastify.post("/gl/post/invoice/:id", async (request, reply) => {
    return GLPostingController.postSalesInvoice(request, reply);
  });

  // Post payment to GL
  fastify.post("/gl/post/payment/:id", async (request, reply) => {
    return GLPostingController.postPayment(request, reply);
  });

  // List GL entries
  fastify.get("/gl/entries", async (request, reply) => {
    return GLPostingController.listEntries(request, reply);
  });

  // Get account balance
  fastify.get("/gl/accounts/:code/balance", async (request, reply) => {
    return GLPostingController.getAccountBalance(request, reply);
  });

  // Get trial balance
  fastify.get("/gl/trial-balance", async (request, reply) => {
    return GLPostingController.getTrialBalance(request, reply);
  });

  // Reverse GL entry
  fastify.put("/gl/entries/:id/reverse", async (request, reply) => {
    return GLPostingController.reverseEntry(request, reply);
  });
}

module.exports = glPostingRoutes;
