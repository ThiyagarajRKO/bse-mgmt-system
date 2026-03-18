"use strict";

const SalesInvoiceController = require("../../controllers/SalesInvoiceController");

async function salesInvoiceRoutes(fastify) {
  // Create invoice
  fastify.post("/sales/invoices", async (request, reply) => {
    return SalesInvoiceController.createInvoice(request, reply);
  });

  // Add line items to invoice
  fastify.post("/sales/invoices/:id/line-items", async (request, reply) => {
    return SalesInvoiceController.addLineItems(request, reply);
  });

  // Update charges (shipping, discount)
  fastify.put("/sales/invoices/:id/charges", async (request, reply) => {
    return SalesInvoiceController.updateCharges(request, reply);
  });

  // Get invoice details
  fastify.get("/sales/invoices/:id", async (request, reply) => {
    return SalesInvoiceController.getInvoiceDetails(request, reply);
  });

  // List invoices
  fastify.get("/sales/invoices", async (request, reply) => {
    return SalesInvoiceController.listInvoices(request, reply);
  });

  // Post invoice to GL
  fastify.put("/sales/invoices/:id/post", async (request, reply) => {
    return SalesInvoiceController.postInvoiceToGL(request, reply);
  });

  // Cancel invoice
  fastify.put("/sales/invoices/:id/cancel", async (request, reply) => {
    return SalesInvoiceController.cancelInvoice(request, reply);
  });

  // Get revenue summary
  fastify.get("/sales/invoices/summary/revenue", async (request, reply) => {
    return SalesInvoiceController.getRevenueSummary(request, reply);
  });

  // Get pending orders for invoicing
  fastify.get("/sales/invoices/pending-orders", async (request, reply) => {
    return SalesInvoiceController.getPendingOrders(request, reply);
  });

  // Bulk generate invoices from multiple orders
  fastify.post("/sales/invoices/bulk-generate", async (request, reply) => {
    return SalesInvoiceController.bulkGenerateInvoices(request, reply);
  });

  // Generate invoices for all pending orders
  fastify.post(
    "/sales/invoices/generate-all-pending",
    async (request, reply) => {
      return SalesInvoiceController.generateAllPendingInvoices(request, reply);
    },
  );
}

module.exports = salesInvoiceRoutes;
