import InvoiceController from "../../controllers/invoice.js";

// Schema definitions
const generateInvoiceSchema = {
  body: {
    type: "object",
    required: ["packing_list_id"],
    properties: {
      packing_list_id: { type: "string" },
    },
  },
};

const previewInvoiceSchema = {
  body: {
    type: "object",
    required: ["packing_list_id"],
    properties: {
      packing_list_id: { type: "string" },
    },
  },
};

const finalizeInvoiceSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
};

const getInvoiceSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
};

const getInvoicesByPackingListSchema = {
  params: {
    type: "object",
    required: ["packing_list_id"],
    properties: {
      packing_list_id: { type: "string" },
    },
  },
};

const getInvoicesByCustomerSchema = {
  params: {
    type: "object",
    required: ["customer_id"],
    properties: {
      customer_id: { type: "string" },
    },
  },
  querystring: {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 1, default: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
    },
  },
};

export const invoiceRoutes = (fastify, opts, done) => {
  // Generate invoice from locked packing list
  fastify.post(
    "/generate",
    {
      schema: generateInvoiceSchema,
      preHandler: fastify.authenticate,
    },
    InvoiceController.generateInvoice
  );

  // Preview invoice (calculate taxes without creating records)
  fastify.post(
    "/preview",
    {
      schema: previewInvoiceSchema,
      preHandler: fastify.authenticate,
    },
    InvoiceController.previewInvoice
  );

  // Finalize invoice (makes it immutable and posts to sales register)
  fastify.put(
    "/:id/finalize",
    {
      schema: finalizeInvoiceSchema,
      preHandler: fastify.authenticate,
    },
    InvoiceController.finalizeInvoice
  );

  // Get invoice details
  fastify.get(
    "/:id",
    {
      schema: getInvoiceSchema,
      preHandler: fastify.authenticate,
    },
    InvoiceController.getInvoice
  );

  // Get invoices by packing list
  fastify.get(
    "/packing-list/:packing_list_id",
    {
      schema: getInvoicesByPackingListSchema,
      preHandler: fastify.authenticate,
    },
    InvoiceController.getInvoicesByPackingList
  );

  // Get invoices by customer
  fastify.get(
    "/customer/:customer_id",
    {
      schema: getInvoicesByCustomerSchema,
      preHandler: fastify.authenticate,
    },
    InvoiceController.getInvoicesByCustomer
  );

  done();
};
